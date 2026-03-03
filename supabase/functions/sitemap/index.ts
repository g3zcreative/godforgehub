import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Content-Type": "application/xml",
  "Cache-Control": "public, max-age=3600",
};

const SITE_URL = "https://godforgehub.lovable.app";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const staticPages = [
    { loc: "/", priority: "1.0" },
    { loc: "/news", priority: "0.9" },
    { loc: "/database", priority: "0.8" },
    { loc: "/guides", priority: "0.8" },
    { loc: "/community", priority: "0.7" },
    { loc: "/tools", priority: "0.5" },
    { loc: "/changelog", priority: "0.4" },
    { loc: "/roadmap", priority: "0.4" },
  ];

  // Fetch dynamic slugs in parallel
  const [newsRes, heroesRes, itemsRes, guidesRes] = await Promise.all([
    supabase.from("news_articles").select("slug, updated_at").eq("published", true),
    supabase.from("heroes").select("slug, updated_at"),
    supabase.from("items").select("slug, updated_at"),
    supabase.from("guides").select("slug, updated_at").eq("published", true),
  ]);

  const urls: string[] = [];

  // Static pages
  for (const p of staticPages) {
    urls.push(`<url><loc>${SITE_URL}${p.loc}</loc><priority>${p.priority}</priority><changefreq>daily</changefreq></url>`);
  }

  // News articles
  for (const a of newsRes.data || []) {
    urls.push(`<url><loc>${SITE_URL}/news/${a.slug}</loc><lastmod>${a.updated_at}</lastmod><priority>0.7</priority></url>`);
  }

  // Heroes
  for (const h of heroesRes.data || []) {
    urls.push(`<url><loc>${SITE_URL}/database/heroes/${h.slug}</loc><lastmod>${h.updated_at}</lastmod><priority>0.7</priority></url>`);
  }

  // Items
  for (const i of itemsRes.data || []) {
    urls.push(`<url><loc>${SITE_URL}/database/items/${i.slug}</loc><lastmod>${i.updated_at}</lastmod><priority>0.6</priority></url>`);
  }

  // Guides
  for (const g of guidesRes.data || []) {
    urls.push(`<url><loc>${SITE_URL}/guides/${g.slug}</loc><lastmod>${g.updated_at}</lastmod><priority>0.7</priority></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
