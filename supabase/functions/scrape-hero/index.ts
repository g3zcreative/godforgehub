const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl is not configured. Connect it in Settings." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Scrape the hero page
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping hero page:", formattedUrl);
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: formattedUrl, formats: ["markdown"], onlyMainContent: true }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      console.error("Firecrawl error:", scrapeData);
      return new Response(JSON.stringify({ error: "Failed to scrape URL: " + (scrapeData.error || scrapeRes.status) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pageContent = scrapeData.data?.markdown || scrapeData.markdown || "";
    if (!pageContent) {
      return new Response(JSON.stringify({ error: "No content found at that URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to extract structured hero data
    console.log("Extracting hero data with AI...");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a data extraction assistant for GodforgeHub, a community database site for the game Godforge.

Extract structured hero data from the scraped godforge.gg hero page content. The page contains information about a Godforge hero.

Map the data to these fields:
- name: The hero's display name (e.g. "Sun Wukong")
- subtitle: The hero's title/epithet shown under the name (e.g. "Monkey King", "Sphinx of Riddles"). Do NOT include the dashes.
- slug: URL-friendly lowercase version with hyphens (e.g. "sun-wukong", "hound-of-duat")
- rarity: Numeric value — legendary=5, epic=4, rare=3, uncommon=2, common=1
- element: The hero's primary element/realm (e.g. "Tian", "Duat", "Olympus", "Asgard"). This is the realm/pantheon the hero belongs to (shown between archetype and allegiance).
- class_type: The hero's archetype (e.g. "Slayer", "Defender", "Sentinel", "Invoker", "Warden")
- affinity: The hero's affinity type (e.g. "Cunning", "Might", "Eternal", "Arcane")
- allegiance: The hero's allegiance (e.g. "Chaos", "Order", "Balance")
- realm: The hero's realm/pantheon (e.g. "Tian", "Duat", "Olympus"). Same as the faction shown on the page.
- description: The hero summary text (1-2 sentences)
- lore: The Story/Lore text from the page if present
- image_url: The hero's main portrait image URL (the large hero image, not small icons)
- stats: JSON object with base stats at Rank 1 / Level 1. Include keys: hp, atk, def, spd, init, crit_rate, crit_dmg, res, acc. Use numeric values.
- skills: Array of skill objects with: name, skill_type (Basic/Core/Ultimate/Passive), description (the full ability text), image_url (skill icon URL if found)

Return your response by calling the create_hero function.`,
          },
          { role: "user", content: pageContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_hero",
              description: "Create a hero entry with extracted data from the page.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  subtitle: { type: "string", description: "Hero title/epithet" },
                  slug: { type: "string" },
                  rarity: { type: "number" },
                  element: { type: "string", description: "Realm/pantheon" },
                  class_type: { type: "string", description: "Archetype" },
                  affinity: { type: "string", description: "Affinity type" },
                  allegiance: { type: "string", description: "Chaos/Order/Balance" },
                  realm: { type: "string", description: "Realm/pantheon" },
                  description: { type: "string" },
                  lore: { type: "string", description: "Story/lore text" },
                  image_url: { type: "string" },
                  stats: {
                    type: "object",
                    properties: {
                      hp: { type: "number" },
                      atk: { type: "number" },
                      def: { type: "number" },
                      spd: { type: "number" },
                      init: { type: "number" },
                      crit_rate: { type: "number" },
                      crit_dmg: { type: "number" },
                      res: { type: "number" },
                      acc: { type: "number" },
                    },
                  },
                  skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        skill_type: { type: "string" },
                        description: { type: "string" },
                        image_url: { type: "string" },
                      },
                      required: ["name", "skill_type", "description"],
                    },
                  },
                },
                required: ["name", "slug", "rarity", "element", "class_type", "description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_hero" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "AI did not return structured output" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hero = JSON.parse(toolCall.function.arguments);
    console.log("Extracted hero:", hero.name);

    return new Response(JSON.stringify(hero), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-hero error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
