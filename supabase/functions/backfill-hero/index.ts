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

    // Auth check
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

    // 1. Fetch current hero + skills + imprints for version snapshot
    const { data: currentHero } = await adminClient
      .from("heroes").select("*").eq("id", hero_id).single();
    const { data: currentSkills } = await adminClient
      .from("skills").select("*").eq("hero_id", hero_id);
    const { data: currentImprints } = await adminClient
      .from("imprints").select("*").eq("source_hero_id", hero_id);

    // 2. Scrape the hero page
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

    // 3. AI extraction
    console.log("Extracting with AI...");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a data extraction assistant for GodforgeHub. Extract ALL fields from this godforge.gg hero page.

Extract these hero fields:
- name: The hero's display name
- subtitle: The hero's title/epithet (without dashes)
- rarity: Numeric value — legendary=5, epic=4, rare=3, uncommon=2, common=1
- element: The hero's realm/pantheon (e.g. "Tian", "Duat", "Olympus")
- class_type: The hero's archetype (e.g. "Slayer", "Defender", "Sentinel", "Invoker", "Warden")
- affinity: The hero's affinity type (e.g. "Cunning", "Might", "Eternal", "Arcane", "Wisdom")
- allegiance: The hero's allegiance (e.g. "Chaos", "Order", "Balance")
- description: The hero summary text (1-2 sentences)
- lore: The Story/Lore text if present
- stats: JSON object with base stats: hp, atk, def, spd, init, crit_rate, crit_dmg, res, acc (numeric values)
- leader_bonus: JSON object with "text" and "scope"
- divinity_generator: The divinity generation text
- ascension_bonuses: Array of {tier, bonus}
- awakening_bonuses: Array of {tier, bonus}
- skills: Array of skill objects with: name, skill_type (Basic/Core/Ultimate/Passive), description, scaling_formula, effects (array of buff/debuff names), awakening_level, awakening_bonus, ultimate_cost, initial_divinity
- imprint: If the hero has an imprint/weapon, extract: name, passive (the passive ability text), rarity (same as hero)

Return by calling the backfill_hero function.`,
          },
          { role: "user", content: pageContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "backfill_hero",
            description: "Backfill hero with all extracted data.",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                subtitle: { type: "string" },
                rarity: { type: "number" },
                element: { type: "string" },
                class_type: { type: "string" },
                affinity: { type: "string" },
                allegiance: { type: "string" },
                description: { type: "string" },
                lore: { type: "string" },
                stats: {
                  type: "object",
                  properties: {
                    hp: { type: "number" }, atk: { type: "number" }, def: { type: "number" },
                    spd: { type: "number" }, init: { type: "number" },
                    crit_rate: { type: "number" }, crit_dmg: { type: "number" },
                    res: { type: "number" }, acc: { type: "number" },
                  },
                },
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
                      description: { type: "string" },
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
                imprint: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    passive: { type: "string" },
                    rarity: { type: "number" },
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

    // 4. Save version snapshot BEFORE updating
    const { data: lastVersion } = await adminClient
      .from("hero_versions")
      .select("version_number")
      .eq("hero_id", hero_id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (lastVersion?.version_number || 0) + 1;

    await adminClient.from("hero_versions").insert({
      hero_id,
      version_number: nextVersion,
      snapshot: currentHero || {},
      skills_snapshot: currentSkills || [],
      imprints_snapshot: currentImprints || [],
      change_source: "backfill",
      changed_by: user.id,
    });

    // 5. Update hero — NEVER overwrite identity fields (name, slug, image_url)
    const heroUpdate: Record<string, unknown> = {};
    // Only update supplementary data fields, not identity fields
    if (extracted.subtitle) heroUpdate.subtitle = extracted.subtitle;
    if (extracted.affinity) heroUpdate.affinity = extracted.affinity;
    if (extracted.allegiance) heroUpdate.allegiance = extracted.allegiance;
    if (extracted.description) heroUpdate.description = extracted.description;
    if (extracted.lore) heroUpdate.lore = extracted.lore;
    if (extracted.stats) heroUpdate.stats = extracted.stats;
    if (extracted.leader_bonus) heroUpdate.leader_bonus = extracted.leader_bonus;
    if (extracted.divinity_generator) heroUpdate.divinity_generator = extracted.divinity_generator;
    if (extracted.ascension_bonuses) heroUpdate.ascension_bonuses = extracted.ascension_bonuses;
    if (extracted.awakening_bonuses) heroUpdate.awakening_bonuses = extracted.awakening_bonuses;

    if (Object.keys(heroUpdate).length > 0) {
      const { error: heroError } = await adminClient
        .from("heroes").update(heroUpdate).eq("id", hero_id);
      if (heroError) {
        console.error("Hero update error:", heroError.message);
        return new Response(JSON.stringify({ error: `Hero update failed: ${heroError.message}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 6. Update/insert skills
    const extractedSkills = extracted.skills || [];
    let skillsUpdated = 0;
    let skillsInserted = 0;

    if (extractedSkills.length > 0) {
      const { data: existingSkills } = await adminClient
        .from("skills").select("id, name").eq("hero_id", hero_id);

      const existingMap = new Map(
        (existingSkills || []).map((s: any) => [s.name.toLowerCase().trim(), s.id])
      );

      for (const es of extractedSkills) {
        const key = es.name.toLowerCase().trim();
        const existingId = existingMap.get(key);

        const skillData: Record<string, unknown> = {
          skill_type: es.skill_type || "Active",
          description: es.description || null,
          scaling_formula: es.scaling_formula || null,
          effects: es.effects || [],
          awakening_level: es.awakening_level || null,
          awakening_bonus: es.awakening_bonus || null,
          ultimate_cost: es.ultimate_cost || null,
          initial_divinity: es.initial_divinity || null,
        };

        if (existingId) {
          const { error } = await adminClient.from("skills").update(skillData).eq("id", existingId);
          if (!error) skillsUpdated++;
        } else {
          const skillSlug = es.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const { error } = await adminClient.from("skills").insert({
            ...skillData,
            hero_id,
            name: es.name,
            slug: `${slug}-${skillSlug}`,
          });
          if (!error) skillsInserted++;
          else console.error("Skill insert error:", error.message);
        }
      }
    }

    // 7. Update/create imprint
    let imprintResult = "skipped";
    if (extracted.imprint?.name) {
      const imprintSlug = extracted.imprint.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const { data: existingImprint } = await adminClient
        .from("imprints")
        .select("id")
        .eq("source_hero_id", hero_id)
        .maybeSingle();

      const imprintData = {
        name: extracted.imprint.name,
        passive: extracted.imprint.passive || null,
        rarity: extracted.imprint.rarity || extracted.rarity || 3,
        source_hero_id: hero_id,
      };

      if (existingImprint) {
        const { error } = await adminClient.from("imprints").update(imprintData).eq("id", existingImprint.id);
        imprintResult = error ? `error: ${error.message}` : "updated";
      } else {
        const { error } = await adminClient.from("imprints").insert({
          ...imprintData,
          slug: imprintSlug,
        });
        imprintResult = error ? `error: ${error.message}` : "created";
      }
    }

    return new Response(JSON.stringify({
      success: true,
      slug,
      version: nextVersion,
      skillsUpdated,
      skillsInserted,
      imprintResult,
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
