import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify admin
    const authHeader = req.headers.get("authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { hero_id, slug } = await req.json();
    if (!hero_id || !slug) {
      return new Response(JSON.stringify({ error: "hero_id and slug are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get hero's element/realm to build the correct godforge URL
    const { data: heroData } = await adminClient.from("heroes").select("element").eq("id", hero_id).single();
    const faction = heroData?.element?.toLowerCase() || "";

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    // godforge.gg URL pattern: /heroes/:faction/:hero-name
    const godforgeUrl = `https://godforge.gg/heroes/${faction}/${slug}`;
    console.log(`Scraping ${godforgeUrl} for hero image...`);

    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: godforgeUrl, formats: ["html"], onlyMainContent: false }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      return new Response(JSON.stringify({ error: "Scrape failed: " + (scrapeData.error || scrapeRes.status) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pageHtml = scrapeData.data?.html || "";
    if (!pageHtml) {
      return new Response(JSON.stringify({ error: "No HTML content found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the hero portrait from: <img src="assets/hero/XX_Character_Name_main.webp" class="heroFullBodyImage">
    const heroImgMatch = pageHtml.match(/<img[^>]+class="heroFullBodyImage"[^>]+src="([^"]+)"/i)
      || pageHtml.match(/<img[^>]+src="([^"]+)"[^>]+class="heroFullBodyImage"/i);

    if (!heroImgMatch) {
      console.error("No heroFullBodyImage found. HTML preview:", pageHtml.slice(0, 1000));
      return new Response(JSON.stringify({ error: "No heroFullBodyImage found on page" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let imgSrc = heroImgMatch[1];
    // Make it absolute if relative
    if (!imgSrc.startsWith("http")) {
      imgSrc = imgSrc.startsWith("/") ? `https://godforge.gg${imgSrc}` : `https://godforge.gg/${imgSrc}`;
    }
    console.log(`Found hero image: ${imgSrc}`);

    // Download the webp image
    const imgRes = await fetch(imgSrc);
    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: `Image download failed: ${imgRes.status} from ${imgSrc}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = (imgRes.headers.get("content-type") || "image/webp").split(";")[0].trim();
    const imageData = new Uint8Array(await imgRes.arrayBuffer());
    const ext = contentType === "image/png" ? "png" : "webp";
    const fileName = `${hero_id}.${ext}`;

    console.log(`Uploading as ${fileName} (${contentType}, ${imageData.length} bytes)`);

    // Delete old files and upload new one
    await adminClient.storage.from("hero-images").remove([`${hero_id}.jpg`, `${hero_id}.png`, `${hero_id}.webp`]);
    const { error: upErr } = await adminClient.storage.from("hero-images").upload(fileName, imageData, { contentType, upsert: true });
    if (upErr) throw upErr;

    const { data: pub } = adminClient.storage.from("hero-images").getPublicUrl(fileName);
    const { error: updErr } = await adminClient.from("heroes").update({ image_url: pub.publicUrl }).eq("id", hero_id);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ success: true, image_url: pub.publicUrl, format: ext }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
