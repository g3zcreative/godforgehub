const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FACTIONS = ["aaru", "asgard", "avalon", "ekur", "izumo", "olympus", "omeyocan", "tian", "vyraj"];
const BASE_URL = "https://godforge.gg/heroes";
const PORTRAIT_BASE = "https://godforge.gg/heroes/assets/hero";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader! } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const targetFaction = body.faction; // optional: process single faction
    const factionsToProcess = targetFaction ? [targetFaction] : FACTIONS;

    const results: { slug: string; status: string; message?: string }[] = [];

    for (const faction of factionsToProcess) {
      console.log(`Processing faction: ${faction}`);
      
      // Fetch faction page HTML
      const pageRes = await fetch(`${BASE_URL}/${faction}`);
      if (!pageRes.ok) {
        results.push({ slug: faction, status: "error", message: `Failed to fetch faction page: ${pageRes.status}` });
        continue;
      }
      const html = await pageRes.text();

      // Extract hero entries: data-hero-id and slug from href
      const heroPattern = /href="[^"]*\/heroes\/[^/]+\/([^"]+)"[^>]*data-hero-id="([^"]+)"/g;
      let match;
      const heroes: { slug: string; characterId: string }[] = [];
      while ((match = heroPattern.exec(html)) !== null) {
        heroes.push({ slug: match[1], characterId: match[2] });
      }

      console.log(`Found ${heroes.length} heroes in ${faction}`);

      for (const hero of heroes) {
        const portraitUrl = `${PORTRAIT_BASE}/${hero.characterId}_portrait.webp`;
        
        // Check if hero exists in DB
        const { data: dbHero } = await supabase
          .from("heroes")
          .select("id, image_url")
          .eq("slug", hero.slug)
          .maybeSingle();

        if (!dbHero) {
          results.push({ slug: hero.slug, status: "skipped", message: "Not in database" });
          continue;
        }

        // Skip if already has a local storage URL
        if (dbHero.image_url && dbHero.image_url.includes(supabaseUrl)) {
          results.push({ slug: hero.slug, status: "skipped", message: "Already has local image" });
          continue;
        }

        // Download portrait
        try {
          const imgRes = await fetch(portraitUrl);
          if (!imgRes.ok) {
            results.push({ slug: hero.slug, status: "error", message: `Portrait 404: ${portraitUrl}` });
            continue;
          }

          const contentType = imgRes.headers.get("content-type") || "image/webp";
          const imgData = new Uint8Array(await imgRes.arrayBuffer());
          
          const ext = contentType.includes("webp") ? "webp" : contentType.includes("png") ? "png" : "jpg";
          const fileName = `${hero.slug}-portrait.${ext}`;

          // Upload to storage
          const { error: uploadErr } = await supabase.storage
            .from("hero-images")
            .upload(fileName, imgData, {
              contentType,
              upsert: true,
            });

          if (uploadErr) {
            results.push({ slug: hero.slug, status: "error", message: uploadErr.message });
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from("hero-images")
            .getPublicUrl(fileName);

          // Update hero record
          const { error: updateErr } = await supabase
            .from("heroes")
            .update({ image_url: publicUrl })
            .eq("id", dbHero.id);

          if (updateErr) {
            results.push({ slug: hero.slug, status: "error", message: updateErr.message });
          } else {
            results.push({ slug: hero.slug, status: "success", message: publicUrl });
          }
        } catch (dlErr: any) {
          results.push({ slug: hero.slug, status: "error", message: dlErr.message });
        }

        // Small delay to avoid overwhelming the server
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const successCount = results.filter(r => r.status === "success").length;
    const skippedCount = results.filter(r => r.status === "skipped").length;
    const errorCount = results.filter(r => r.status === "error").length;

    return new Response(
      JSON.stringify({ success: true, successCount, skippedCount, errorCount, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
