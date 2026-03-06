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

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    // Scrape the hero page to find the image URL
    const godforgeUrl = `https://godforge.gg/heroes/${slug}`;
    console.log(`Scraping ${godforgeUrl} for image URL...`);

    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: godforgeUrl, formats: ["markdown"], onlyMainContent: true }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      return new Response(JSON.stringify({ error: "Scrape failed: " + (scrapeData.error || scrapeRes.status) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pageContent = scrapeData.data?.markdown || "";
    if (!pageContent) {
      return new Response(JSON.stringify({ error: "No content found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the hero portrait image URL directly via regex
    // Hero portraits have _Base.png in the path, which distinguishes them from logos/icons
    const baseImgMatch = pageContent.match(/https:\/\/godforge\.gg\/_next\/image\?url=%2Fapi%2Fmedia%2Ffile%2F[^&\s)]*_Base\.png[^&\s)]*&w=\d+&q=\d+/i);
    
    // Fallback: any /api/media/file/ image that's not a tiny icon (w>=640)
    const anyImgMatch = !baseImgMatch 
      ? pageContent.match(/https:\/\/godforge\.gg\/_next\/image\?url=%2Fapi%2Fmedia%2Ffile%2F[^&\s)]+&w=(?:3840|1920|1280|640)&q=\d+/) 
      : null;

    const imgUrl = baseImgMatch?.[0] || anyImgMatch?.[0];
    
    if (!imgUrl) {
      console.error("No hero image found in page content. Content preview:", pageContent.slice(0, 500));
      return new Response(JSON.stringify({ error: "No hero portrait image found on page" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Found image URL:", imgUrl);

    // Extract raw path for transparent PNG download
    const parsed = new URL(imgUrl);
    const rawPath = parsed.searchParams.get("url");
    const downloadUrl = rawPath ? `https://godforge.gg${rawPath}` : imgUrl;
    console.log(`Downloading from: ${downloadUrl}`);

    // Download the image
    let imgRes = await fetch(downloadUrl);
    if (!imgRes.ok) {
      // Fallback to the /_next/image URL
      console.log("Raw URL failed, trying /_next/image URL...");
      imgRes = await fetch(imgUrl, { headers: { "Accept": "image/webp,image/png,*/*" } });
      if (!imgRes.ok) {
        return new Response(JSON.stringify({ error: `Image download failed: ${imgRes.status}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const contentType = (imgRes.headers.get("content-type") || "image/png").split(";")[0].trim();
    const imageData = new Uint8Array(await imgRes.arrayBuffer());
    const ext = contentType === "image/webp" ? "webp" : "png";
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
