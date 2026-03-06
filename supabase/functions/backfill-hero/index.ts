import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
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
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const url = `https://godforge.gg/heroes/${slug}`;
    console.log("Backfilling:", url);

    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      return new Response(JSON.stringify({ error: `Scrape failed: ${scrapeData.error || scrapeRes.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pageContent = scrapeData.data?.markdown || scrapeData.markdown || "";
    if (!pageContent) {
      return new Response(JSON.stringify({ error: "No content found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Extracting with AI...");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a data extraction assistant for GodforgeHub. Extract NEW fields from this godforge.gg hero page that were previously missing.

Extract these fields:
- leader_bonus: JSON object with "text" (e.g. "20% DEF") and "scope" (e.g. "All Battles")
- divinity_generator: The divinity generation text (e.g. "Gain [50] Divinity when hit by an enemy.")
- ascension_bonuses: Array of objects with "tier" (number 1-6) and "bonus" (text)
- awakening_bonuses: Array of objects with "tier" (number 1-5) and "bonus" (text)
- skills: Array of skill objects with: name, skill_type (Basic/Core/Ultimate/Passive), scaling_formula (e.g. "175%DEF + 80%ATK"), effects (array of buff/debuff names), awakening_level (integer), awakening_bonus (text), ultimate_cost (integer for Ultimate only), initial_divinity (integer for Ultimate only)

Return by calling the backfill_hero function.`,
          },
          { role: "user", content: pageContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "backfill_hero",
            description: "Backfill hero with new fields.",
            parameters: {
              type: "object",
              properties: {
                leader_bonus: {
                  type: "object",
                  properties: { text: { type: "string" }, scope: { type: "string" } },
                },
                divinity_generator: { type: "string" },
                ascension_bonuses: {
                  type: "array",
                  items: { type: "object", properties: { tier: { type: "number" }, bonus: { type: "string" } }, required: ["tier", "bonus"] },
                },
                awakening_bonuses: {
                  type: "array",
                  items: { type: "object", properties: { tier: { type: "number" }, bonus: { type: "string" } }, required: ["tier", "bonus"] },
                },
                skills: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      skill_type: { type: "string" },
                      scaling_formula: { type: "string" },
                      effects: { type: "array", items: { type: "string" } },
                      awakening_level: { type: "number" },
                      awakening_bonus: { type: "string" },
                      ultimate_cost: { type: "number" },
                      initial_divinity: { type: "number" },
                    },
                    required: ["name", "skill_type"],
                  },
                },
              },
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "backfill_hero" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited", retryable: true }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return structured output" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    console.log("Extracted backfill data for:", slug);

    // Update hero with new fields
    const { error: heroError } = await adminClient
      .from("heroes")
      .update({
        leader_bonus: extracted.leader_bonus || {},
        divinity_generator: extracted.divinity_generator || null,
        ascension_bonuses: extracted.ascension_bonuses || [],
        awakening_bonuses: extracted.awakening_bonuses || [],
      })
      .eq("id", hero_id);

    if (heroError) {
      return new Response(JSON.stringify({ error: `Hero update failed: ${heroError.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update skills with new fields (match by name)
    const extractedSkills = extracted.skills || [];
    let skillsUpdated = 0;
    if (extractedSkills.length > 0) {
      // Get existing skills for this hero
      const { data: existingSkills } = await adminClient
        .from("skills")
        .select("id, name")
        .eq("hero_id", hero_id);

      if (existingSkills) {
        for (const es of existingSkills) {
          const match = extractedSkills.find((s: any) =>
            s.name.toLowerCase().trim() === es.name.toLowerCase().trim()
          );
          if (match) {
            const { error } = await adminClient
              .from("skills")
              .update({
                scaling_formula: match.scaling_formula || null,
                effects: match.effects || [],
                awakening_level: match.awakening_level || null,
                awakening_bonus: match.awakening_bonus || null,
                ultimate_cost: match.ultimate_cost || null,
                initial_divinity: match.initial_divinity || null,
              })
              .eq("id", es.id);
            if (!error) skillsUpdated++;
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      slug,
      skillsUpdated,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("backfill-hero error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
