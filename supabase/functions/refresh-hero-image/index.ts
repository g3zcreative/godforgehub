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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Scrape the hero page to get the image URL
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

    // Use AI to extract just the image URL
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Extract only the hero's main portrait image URL from this godforge.gg page content. 
The image URL typically looks like: https://godforge.gg/_next/image?url=%2Fapi%2Fmedia%2Ffile%2F{CODE}_Base.png&w=3840&q=75
Return the image URL by calling the extract_image function. If you find a /_next/image URL, also extract the raw source path from the url parameter (decoded).`,
          },
          { role: "user", content: pageContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_image",
            description: "Extract the hero image URL",
            parameters: {
              type: "object",
              properties: {
                image_url: { type: "string", description: "The full /_next/image URL" },
                raw_path: { type: "string", description: "The decoded raw path from the url param, e.g. /api/media/file/ATL_Base.png" },
              },
              required: ["image_url"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_image" } },
      }),
    });

    const aiData = await aiRes.json();
    console.log("AI response:", JSON.stringify(aiData).slice(0, 500));
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      // Fallback: try to extract image URL from markdown directly
      const imgMatch = pageContent.match(/https:\/\/godforge\.gg\/_next\/image\?url=%2Fapi%2Fmedia%2Ffile%2F[^&\s)]+&w=\d+&q=\d+/);
      if (imgMatch) {
        console.log("Fallback: extracted image URL from markdown:", imgMatch[0]);
        const parsed = new URL(imgMatch[0]);
        const rawPath = parsed.searchParams.get("url");
        const downloadUrl = rawPath ? `https://godforge.gg${rawPath}` : imgMatch[0];
        
        const imgRes = await fetch(downloadUrl);
        if (imgRes.ok) {
          const contentType = (imgRes.headers.get("content-type") || "image/png").split(";")[0].trim();
          const imageData = new Uint8Array(await imgRes.arrayBuffer());
          const ext = contentType === "image/webp" ? "webp" : "png";
          const fileName = `${hero_id}.${ext}`;
          
          await adminClient.storage.from("hero-images").remove([`${hero_id}.jpg`, `${hero_id}.png`, `${hero_id}.webp`]);
          const { error: upErr } = await adminClient.storage.from("hero-images").upload(fileName, imageData, { contentType, upsert: true });
          if (upErr) throw upErr;
          
          const { data: pub } = adminClient.storage.from("hero-images").getPublicUrl(fileName);
          await adminClient.from("heroes").update({ image_url: pub.publicUrl }).eq("id", hero_id);
          
          return new Response(JSON.stringify({ success: true, image_url: pub.publicUrl, format: ext }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      
      return new Response(JSON.stringify({ error: "AI could not extract image URL", aiResponse: JSON.stringify(aiData).slice(0, 300) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    console.log("Extracted:", extracted);

    // Determine the best URL to download - prefer raw path for transparency
    let downloadUrl: string;
    if (extracted.raw_path) {
      downloadUrl = `https://godforge.gg${extracted.raw_path}`;
    } else if (extracted.image_url) {
      // Try to parse raw path from /_next/image URL
      try {
        const parsed = new URL(extracted.image_url);
        const rawPath = parsed.searchParams.get("url");
        if (rawPath) {
          downloadUrl = `https://godforge.gg${rawPath}`;
        } else {
          downloadUrl = extracted.image_url;
        }
      } catch {
        downloadUrl = extracted.image_url;
      }
    } else {
      return new Response(JSON.stringify({ error: "No image URL found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Downloading image from: ${downloadUrl}`);

    // Download the raw image (PNG with transparency)
    const imgRes = await fetch(downloadUrl);
    if (!imgRes.ok) {
      // Fallback to the /_next/image URL with webp accept header
      console.log("Raw URL failed, trying /_next/image with WebP...");
      const fallbackUrl = extracted.image_url || downloadUrl;
      const imgRes2 = await fetch(fallbackUrl, {
        headers: { "Accept": "image/webp,image/png,*/*" },
      });
      if (!imgRes2.ok) {
        return new Response(JSON.stringify({ error: `Image download failed: ${imgRes2.status}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const ct = (imgRes2.headers.get("content-type") || "image/webp").split(";")[0].trim();
      const imageData = new Uint8Array(await imgRes2.arrayBuffer());
      const ext = ct === "image/webp" ? "webp" : ct === "image/png" ? "png" : "webp";
      const fileName = `${hero_id}.${ext}`;

      // Delete old file if exists
      await adminClient.storage.from("hero-images").remove([`${hero_id}.jpg`, `${hero_id}.png`, `${hero_id}.webp`]);

      const { error: upErr } = await adminClient.storage.from("hero-images").upload(fileName, imageData, {
        contentType: ct, upsert: true,
      });
      if (upErr) throw upErr;

      const { data: pub } = adminClient.storage.from("hero-images").getPublicUrl(fileName);
      await adminClient.from("heroes").update({ image_url: pub.publicUrl }).eq("id", hero_id);

      return new Response(JSON.stringify({ success: true, image_url: pub.publicUrl, format: ext }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = (imgRes.headers.get("content-type") || "image/png").split(";")[0].trim();
    const imageData = new Uint8Array(await imgRes.arrayBuffer());
    const ext = contentType === "image/webp" ? "webp" : contentType === "image/png" ? "png" : "png";
    const fileName = `${hero_id}.${ext}`;

    console.log(`Uploading as ${fileName} (${contentType}, ${imageData.length} bytes)`);

    // Delete old files
    await adminClient.storage.from("hero-images").remove([`${hero_id}.jpg`, `${hero_id}.png`, `${hero_id}.webp`]);

    const { error: upErr } = await adminClient.storage.from("hero-images").upload(fileName, imageData, {
      contentType, upsert: true,
    });
    if (upErr) throw upErr;

    const { data: pub } = adminClient.storage.from("hero-images").getPublicUrl(fileName);

    // Update hero record
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
