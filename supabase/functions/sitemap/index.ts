import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://godforgehub.com";
const FUNC_URL = Deno.env.get("SUPABASE_URL")! + "/functions/v1/sitemap";

const xmlHeaders = {
  "Content-Type": "application/xml",
  "Cache-Control": "public, max-age=3600",
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // If no type param, return sitemap index
  if (!type) {
    const sitemaps = ["static", "news", "heroes", "items", "guides", "skills", "imprints", "weapons", "bosses"];
    const entries = sitemaps.map(
      (s) => `<sitemap><loc>${FUNC_URL}?type=${s}</loc></sitemap>`
    );
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</sitemapindex>`;
    return new Response(xml, { headers: xmlHeaders });
  }

  // Child sitemaps
  const urls: string[] = [];

  if (type === "static") {
    const pages = [
      { loc: "/", priority: "1.0" },
      { loc: "/news", priority: "0.9" },
      { loc: "/database", priority: "0.8" },
      { loc: "/bosses", priority: "0.8" },
      { loc: "/guides", priority: "0.8" },
      { loc: "/community", priority: "0.7" },
      { loc: "/tools", priority: "0.5" },
      { loc: "/changelog", priority: "0.4" },
      { loc: "/roadmap", priority: "0.4" },
    ];
    for (const p of pages) {
      urls.push(`<url><loc>${SITE_URL}${p.loc}</loc><priority>${p.priority}</priority><changefreq>daily</changefreq></url>`);
    }
  } else {
    const config: Record<string, { table: string; prefix: string; priority: string; filter?: Record<string, unknown> }> = {
      news:     { table: "news_articles", prefix: "/news",              priority: "0.7", filter: { published: true } },
      heroes:   { table: "heroes",        prefix: "/database/heroes",   priority: "0.7" },
      items:    { table: "items",          prefix: "/database/items",    priority: "0.6" },
      guides:   { table: "guides",         prefix: "/guides",            priority: "0.7", filter: { published: true } },
      skills:   { table: "skills",         prefix: "/database/skills",   priority: "0.6" },
      imprints: { table: "imprints",       prefix: "/database/imprints", priority: "0.6" },
      weapons:  { table: "weapons",        prefix: "/database/weapons",  priority: "0.6" },
      bosses:   { table: "bosses",         prefix: "/bosses",            priority: "0.7" },
    };

    const cfg = config[type];
    if (!cfg) {
      return new Response("Unknown sitemap type", { status: 404 });
    }

    let query = supabase.from(cfg.table).select("slug, updated_at");
    if (cfg.filter) {
      for (const [k, v] of Object.entries(cfg.filter)) {
        query = query.eq(k, v);
      }
    }
    const { data } = await query;

    for (const row of data || []) {
      urls.push(`<url><loc>${SITE_URL}${cfg.prefix}/${row.slug}</loc><lastmod>${row.updated_at}</lastmod><priority>${cfg.priority}</priority></url>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, { headers: xmlHeaders });
});
