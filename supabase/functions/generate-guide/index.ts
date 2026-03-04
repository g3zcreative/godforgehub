import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { videoUrl, category, prompt } = await req.json();

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "videoUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const categoryHint = category ? ` The guide category is "${category}".` : "";

    let formattedVideoUrl = videoUrl.trim();
    if (!formattedVideoUrl.startsWith("http://") && !formattedVideoUrl.startsWith("https://")) {
      formattedVideoUrl = `https://${formattedVideoUrl}`;
    }

    console.log("Processing video URL for guide:", formattedVideoUrl);

    const contextHint = prompt ? `\n\nAdditional context from the author: ${prompt}` : "";

    const systemPrompt = `You are a guide writer for GodforgeHub, a community site for a gacha RPG game called Godforge.${categoryHint}

Watch and analyze the provided YouTube video, then write a comprehensive guide based on its content for the GodforgeHub community. Focus on actionable strategies, builds, tips, or walkthroughs discussed in the video. Rephrase and restructure the content into a well-organized guide — do NOT just transcribe.

You can embed interactive database links using bracket syntax:
- [hero:slug] for heroes (e.g. [hero:sun-wukong])
- [skill:slug] for skills (e.g. [skill:phoenix-strike])
- [item:slug] for items (e.g. [item:iron-sword])
- [mechanic:slug] for mechanics (e.g. [mechanic:atk-up-ii])

Use these entity links wherever you reference specific heroes, skills, items, or mechanics. Slugs are lowercase, hyphen-separated.${contextHint}

Return your response by calling the create_guide function. The content should be well-structured markdown with headers, and the slug should be a URL-friendly lowercase version of the title. Keep the excerpt under 200 characters.`;

    const userMessage = [
      { type: "text", text: "Analyze this video and write a detailed guide based on its content." },
      { type: "file", file: { url: formattedVideoUrl } },
    ];

    console.log("Calling Lovable AI...");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_guide",
              description: "Create a guide draft with title, slug, excerpt, author, and markdown content.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Guide title" },
                  slug: { type: "string", description: "URL-friendly slug" },
                  excerpt: { type: "string", description: "Short summary under 200 chars" },
                  content: { type: "string", description: "Full guide in markdown, using entity markup links" },
                  author: { type: "string", description: "Author name (use the video creator's name if visible)" },
                },
                required: ["title", "slug", "excerpt", "content"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_guide" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
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

    const guide = JSON.parse(toolCall.function.arguments);
    console.log("Generated guide:", guide.title);

    return new Response(JSON.stringify(guide), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-guide error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
