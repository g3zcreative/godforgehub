import { useParams, Link } from "react-router-dom";
import { preprocessMarkup } from "@/lib/guide-markup";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Zap, Star, History, Swords, Stamp, Users, ExternalLink, MessageSquare } from "lucide-react";
import { DatabaseBreadcrumb, DropdownItem } from "@/components/DatabaseBreadcrumb";
import { SEO } from "@/components/SEO";
import { useSeoTemplate, interpolateTemplate } from "@/hooks/useSeoTemplate";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { format } from "date-fns";
import { getLocalHero, getLocalHeroes } from "@/lib/localHeroes";
import heroSentimentData from "@/data/hero_sentiment.json";


const rarityStars = (r: number) => "★".repeat(r) + "☆".repeat(Math.max(0, 5 - r));

const rarityLabel = (r: number) => {
  const labels: Record<number, string> = { 5: "Legendary", 4: "Epic", 3: "Rare", 2: "Uncommon", 1: "Common" };
  return labels[r] || `${r}★`;
};

const rarityLabelColor = (r: number) => {
  const colors: Record<number, string> = {
    5: "text-orange-400",
    4: "text-purple-400",
    3: "text-blue-400",
    2: "text-green-400",
    1: "text-gray-400",
  };
  return colors[r] || "text-primary";
};

function getChangeSummary(v: any, vPrev: any): string {
  if (!vPrev) {
    return "Initial profile backfill";
  }

  const changes: string[] = [];

  const snap = v.snapshot || {};
  const prevSnap = vPrev.snapshot || {};

  // Check stats
  const stats = snap.stats || {};
  const prevStats = prevSnap.stats || {};
  const statsChanged = Object.keys({ ...stats, ...prevStats }).some(
    (key) => stats[key] !== prevStats[key]
  );
  if (statsChanged) {
    changes.push("Stats adjusted");
  }

  // Check description, subtitle, lore, etc.
  if (snap.subtitle !== prevSnap.subtitle) changes.push("Subtitle updated");
  if (snap.description !== prevSnap.description) changes.push("Description updated");
  if (snap.lore !== prevSnap.lore) changes.push("Story/Lore updated");
  if (snap.faction !== prevSnap.faction) changes.push("Faction updated");
  if (snap.archetype !== prevSnap.archetype) changes.push("Archetype updated");
  if (snap.affinity !== prevSnap.affinity) changes.push("Affinity updated");
  if (snap.allegiance !== prevSnap.allegiance) changes.push("Allegiance updated");
  if (snap.image_url !== prevSnap.image_url) changes.push("Portrait image updated");
  if (snap.imprint_passive !== prevSnap.imprint_passive) changes.push("Imprint bonus updated");

  // Check skills
  const skills = v.skills_snapshot || [];
  const prevSkills = vPrev.skills_snapshot || [];

  const skillNames = Array.from(new Set([
    ...skills.map((s: any) => s.name),
    ...prevSkills.map((s: any) => s.name)
  ])).filter(Boolean);

  let skillChangesCount = 0;
  let skillAdded = false;
  let skillRemoved = false;

  for (const name of skillNames) {
    const s = skills.find((x: any) => x.name === name);
    const sPrev = prevSkills.find((x: any) => x.name === name);

    if (s && !sPrev) {
      skillAdded = true;
    } else if (!s && sPrev) {
      skillRemoved = true;
    } else if (s && sPrev) {
      const descDiff = s.description !== sPrev.description;
      const typeDiff = s.skill_type !== sPrev.skill_type;
      const formulaDiff = s.scaling_formula !== sPrev.scaling_formula;
      const urlDiff = s.image_url !== sPrev.image_url;
      const awakeDiff = s.awakening_bonus !== sPrev.awakening_bonus || s.awakening_level !== sPrev.awakening_level;
      const ultDiff = s.ultimate_cost !== sPrev.ultimate_cost || s.initial_divinity !== sPrev.initial_divinity;

      if (descDiff || typeDiff || formulaDiff || urlDiff || awakeDiff || ultDiff) {
        skillChangesCount++;
      }
    }
  }

  if (skillAdded) changes.push("Skills added");
  if (skillRemoved) changes.push("Skills removed");
  if (skillChangesCount > 0) {
    changes.push(`${skillChangesCount} skill${skillChangesCount > 1 ? "s" : ""} updated`);
  }

  return changes.length > 0 ? changes.join(", ") : "Metadata updated";
}

export default function HeroDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: tpl } = useSeoTemplate("hero");

  const { data: hero, isLoading } = useQuery({
    queryKey: ["hero_local", slug],
    queryFn: async () => {
      const data = getLocalHero(slug!);
      if (!data) return null;

      const [factionRes, archetypeRes, affinityRes, allegianceRes] = await Promise.all([
        data.faction ? supabase.from("factions").select("name, icon_url").ilike("name", data.faction).maybeSingle() : { data: null },
        data.archetype ? supabase.from("archetypes").select("name, icon_url").ilike("name", data.archetype).maybeSingle() : { data: null },
        data.affinity ? supabase.from("affinities").select("name, icon_url").ilike("name", data.affinity).maybeSingle() : { data: null },
        data.allegiance ? supabase.from("allegiances").select("name, icon_url").ilike("name", data.allegiance).maybeSingle() : { data: null },
      ]);

      return {
        ...data,
        faction_name: factionRes?.data?.name || data.faction,
        faction_icon: factionRes?.data?.icon_url || null,
        archetype_name: archetypeRes?.data?.name || data.archetype,
        archetype_icon: archetypeRes?.data?.icon_url || null,
        affinity_name: affinityRes?.data?.name || data.affinity,
        affinity_icon: affinityRes?.data?.icon_url || null,
        allegiance_name: allegianceRes?.data?.name || data.allegiance,
        allegiance_icon: allegianceRes?.data?.icon_url || null,
      } as any;
    },
    enabled: !!slug,
  });

  // Fetch all factions for breadcrumb dropdown
  const { data: allFactions } = useQuery({
    queryKey: ["ref_factions_breadcrumb"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factions")
        .select("id, name, slug, icon_url")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all heroes in the same faction for breadcrumb dropdown
  const { data: factionHeroes } = useQuery({
    queryKey: ["faction_heroes_breadcrumb_local", hero?.faction],
    queryFn: async () => {
      if (!hero?.faction) return [];
      const list = getLocalHeroes();
      return list
        .filter((h) => h.faction?.toLowerCase() === hero.faction?.toLowerCase())
        .map((h) => ({ name: h.name, slug: h.slug, image_url: h.image_url }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!hero?.faction,
  });

  const skills = hero?.skills || [];
  const sentiment = hero ? (heroSentimentData as Record<string, any>)[hero.slug] : null;
  const passiveSkill = skills.find((s) => s.skill_type?.toLowerCase() === "passive");
  const imprintImageUrl = passiveSkill?.image_url;

  const { data: builds } = useQuery({
    queryKey: ["hero_builds", hero?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_builds")
        .select("*")
        .eq("hero_id", hero!.id)
        .eq("published", true)
        .eq("featured", true)
        .order("sort_order");
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Resolve gear for each build
      const enriched = await Promise.all(data.map(async (build: any) => {
        const [wRes, iRes, aRes, sRes] = await Promise.all([
          build.weapon_id ? supabase.from("weapons").select("id, name, slug, image_url, rarity, passive").eq("id", build.weapon_id).maybeSingle() : { data: null },
          build.imprint_id ? supabase.from("imprints").select("id, name, slug, image_url, rarity, passive").eq("id", build.imprint_id).maybeSingle() : { data: null },
          build.armor_set_id ? supabase.from("armor_sets").select("id, name, slug, image_url, set_bonus").eq("id", build.armor_set_id).maybeSingle() : { data: null },
          supabase.from("hero_build_synergies").select("*, heroes:hero_id(id, name, slug, image_url)").eq("build_id", build.id).order("sort_order"),
        ]);
        return {
          ...build,
          weapon: wRes?.data || null,
          imprint: iRes?.data || null,
          armor_set: aRes?.data || null,
          synergies: sRes.data || [],
        };
      }));
      return enriched;
    },
    enabled: !!hero?.id,
  });

  const { data: versions } = useQuery({
    queryKey: ["hero_versions", hero?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_versions")
        .select("id, version_number, change_source, created_at, snapshot, skills_snapshot, imprints_snapshot")
        .eq("hero_id", hero!.id)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hero?.id,
  });

  const [versionOpen, setVersionOpen] = useState(false);

  const leaderBonus = hero?.leader_bonus as { text?: string; scope?: string } | null;
  const ascensionBonuses = (hero?.ascension_bonuses || []) as { tier: number; bonus: string }[];
  const awakeningBonuses = (hero?.awakening_bonuses || []) as { tier: number; bonus: string }[];
  const hasBuilds = (builds?.length || 0) > 0;

  const heroSeoVars = hero ? { name: hero.name, element: hero.faction_name, class_type: hero.archetype_name, faction: hero.faction_name, archetype: hero.archetype_name, rarity: hero.rarity, rarity_label: rarityLabel(hero.rarity), description: hero.description, subtitle: hero.subtitle } : {};
  const seoTitle = interpolateTemplate(tpl?.title_template, heroSeoVars);
  const seoDesc = interpolateTemplate(tpl?.description_template, heroSeoVars);

  // Build breadcrumb segments with dropdowns
  const factionDropdown: DropdownItem[] = (allFactions || []).map((f) => ({
    label: f.name,
    href: `/database/heroes?faction=${f.slug}`,
    iconUrl: f.icon_url,
    active: hero?.faction?.toLowerCase() === f.name?.toLowerCase(),
  }));

  const heroDropdown: DropdownItem[] = (factionHeroes || []).map((h) => ({
    label: h.name,
    href: `/database/heroes/${h.slug}`,
    iconUrl: h.image_url,
    active: h.slug === slug,
  }));

  const breadcrumbSegments = [
    { label: "Heroes", href: "/database/heroes" },
    ...(hero?.faction_name
      ? [{
          label: hero.faction_name,
          href: `/database/heroes?faction=${allFactions?.find(f => f.name?.toLowerCase() === hero.faction?.toLowerCase())?.slug || ""}`,
          dropdown: factionDropdown,
        }]
      : []),
    {
      label: hero?.name || "...",
      dropdown: heroDropdown.length > 1 ? heroDropdown : undefined,
    },
  ];

  return (
    <Layout>
      <div className="container max-w-7xl py-8">
        <DatabaseBreadcrumb segments={breadcrumbSegments} />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !hero ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-display font-bold mb-2">Hero not found</h1>
            <p className="text-muted-foreground">This hero doesn't exist in the database.</p>
          </div>
        ) : (
          <>
            <SEO
              rawTitle={seoTitle || `${hero.name} Guide, Builds & Review - Godforge`}
              description={seoDesc || `Get the ultimate ${hero.name} guide & review for Godforge. Check out ${hero.name}'s skills, builds, imprints, stats, and team synergies. Updated for the latest patch.`}
              image={hero.image_url || undefined}
              url={`/database/heroes/${hero.slug}`}
              jsonLd={{
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "GameCharacter",
                    "@id": `https://godforgehub.com/database/heroes/${hero.slug}#character`,
                    "name": hero.name,
                    "description": hero.description && hero.description !== "WIP" ? hero.description : `${hero.name} is a ${rarityLabel(hero.rarity)} rarity ${hero.archetype_name || ''} character in Godforge.`,
                    ...(hero.image_url ? { "image": hero.image_url } : {}),
                  },
                  {
                    "@type": "Review",
                    "@id": `https://godforgehub.com/database/heroes/${hero.slug}#review`,
                    "itemReviewed": {
                      "@type": "GameCharacter",
                      "@id": `https://godforgehub.com/database/heroes/${hero.slug}#character`
                    },
                    "author": {
                      "@type": "Organization",
                      "name": "GodforgeHub"
                    },
                    "reviewRating": {
                      "@type": "Rating",
                      "ratingValue": "4.8",
                      "bestRating": "5"
                    },
                    "reviewBody": `Detailed analysis and guide for ${hero.name} in Godforge. Covering skills, imprints, builds, and team synergies.`
                  }
                ]
              }}
            />

            {/* ===== ABOVE THE FOLD: Two columns ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
              {/* Left Column: Hero Info */}
              <div className="lg:col-span-3 space-y-4">
                <p className={`text-sm font-bold uppercase tracking-widest ${rarityLabelColor(hero.rarity)}`}>
                  {rarityLabel(hero.rarity)} <span className="ml-1">{rarityStars(hero.rarity)}</span>
                </p>
                <h1 className="text-4xl md:text-5xl font-display font-bold">{hero.name}</h1>
                {hero.subtitle && (
                  <p className="text-muted-foreground italic text-lg">— {hero.subtitle} —</p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                    Guide & Review
                  </Badge>
                  {hero.archetype_name && (
                    <Badge variant="outline" className="border-border">
                      {hero.archetype_name} Build
                    </Badge>
                  )}
                  {hero.faction_name && (
                    <Badge variant="outline" className="border-border">
                      {hero.faction_name} Faction
                    </Badge>
                  )}
                </div>

                {/* Attribute Icons Row */}
                <TooltipProvider delayDuration={200}>
                  <div className="flex items-center gap-4 py-3">
                    <AttributeIcon
                      label="Faction"
                      name={hero.faction_name}
                      iconUrl={hero.faction_icon}
                    />
                    <AttributeIcon
                      label="Archetype"
                      name={hero.archetype_name}
                      iconUrl={hero.archetype_icon}
                    />
                    {(hero.affinity_name || hero.affinity) && (
                      <AttributeIcon
                        label="Affinity"
                        name={hero.affinity_name || hero.affinity}
                        iconUrl={hero.affinity_icon}
                      />
                    )}
                    {(hero.allegiance_name || hero.allegiance) && (
                      <AttributeIcon
                        label="Allegiance"
                        name={hero.allegiance_name || hero.allegiance}
                        iconUrl={hero.allegiance_icon}
                      />
                    )}
                  </div>
                </TooltipProvider>

                {hero.description && (
                  <p className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: preprocessMarkup(hero.description) }} />
                )}

                {hero.image_url && (
                  <div className="pt-4">
                    <img
                      src={hero.image_url}
                      alt={hero.name}
                      className="max-h-[500px] w-auto mx-auto lg:mx-0"
                      style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))" }}
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Recommendations or Skills fallback */}
              <div className="lg:col-span-2 space-y-6">
                {hasBuilds ? (
                  <>
                    {builds!.map((build: any) => (
                      <div key={build.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h2 className="text-base font-display font-semibold">{build.title}</h2>
                          <Link
                            to={`/database/heroes/${hero.slug}/builds/${build.slug}`}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Full Guide <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                        {build.weapon && (
                          <Link to={`/database/weapons/${build.weapon.slug}`} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/30 transition-colors bg-card group">
                            {build.weapon.image_url && <img src={build.weapon.image_url} alt={build.weapon.name} className="h-10 w-10 rounded object-cover border border-border" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5"><Swords className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] text-muted-foreground uppercase font-semibold">Weapon</span></div>
                              <p className="font-display font-semibold text-sm truncate">{build.weapon.name}</p>
                              {build.weapon.passive && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{build.weapon.passive}</p>}
                            </div>
                          </Link>
                        )}
                        {build.imprint && (
                          <Link to={`/database/imprints/${build.imprint.slug}`} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/30 transition-colors bg-card group">
                            {build.imprint.image_url && <img src={build.imprint.image_url} alt={build.imprint.name} className="h-10 w-10 rounded object-cover border border-border" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5"><Stamp className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] text-muted-foreground uppercase font-semibold">Imprint</span></div>
                              <p className="font-display font-semibold text-sm truncate">{build.imprint.name}</p>
                              {build.imprint.passive && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{build.imprint.passive}</p>}
                            </div>
                          </Link>
                        )}
                        {build.armor_set && (
                          <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-card">
                            {build.armor_set.image_url && <img src={build.armor_set.image_url} alt={build.armor_set.name} className="h-10 w-10 rounded object-cover border border-border" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5"><Shield className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] text-muted-foreground uppercase font-semibold">Armor Set</span></div>
                              <p className="font-display font-semibold text-sm truncate">{build.armor_set.name}</p>
                              {build.armor_set.set_bonus && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{build.armor_set.set_bonus}</p>}
                            </div>
                          </div>
                        )}
                        {build.synergies.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-2 flex items-center gap-1"><Users className="h-3.5 w-3.5 text-primary" /> Synergies</p>
                            <div className="space-y-2">
                              {build.synergies.map((s: any) => (
                                <Link key={s.id} to={`/database/heroes/${s.heroes?.slug}`} className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:border-primary/30 transition-colors bg-card">
                                  {s.heroes?.image_url && <img src={s.heroes.image_url} alt={s.heroes.name} className="h-8 w-8 rounded object-cover border border-border" />}
                                  <div>
                                    <p className="font-display font-semibold text-sm">{s.heroes?.name}</p>
                                    {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {skills && skills.length > 0 && (
                      <div>
                        <h2 className="text-base font-display font-semibold mb-3">Hero Skills</h2>
                        <div className="space-y-3">
                          {skills.map((skill) => (
                            <Link key={skill.id} to={`/database/skills/${skill.slug}`} className="flex items-start gap-3 rounded-lg border border-border p-3 hover:border-primary/30 transition-colors group bg-card">
                              {skill.image_url && (
                                <img src={skill.image_url} alt={skill.name} className="h-10 w-10 rounded-full object-cover flex-shrink-0 border-2 border-border group-hover:border-primary/40 transition-colors" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                                  <h3 className="font-display font-bold uppercase tracking-wide text-sm">{skill.name}</h3>
                                  <span className="text-xs text-muted-foreground font-semibold uppercase">({skill.skill_type})</span>
                                </div>
                                {skill.description && <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: preprocessMarkup(skill.description) }} />}
                                {skill.awakening_bonus && (
                                  <p className="text-xs text-primary/80 mt-1">
                                    <Star className="inline h-3 w-3 mr-1" />
                                    Awakening {skill.awakening_level || ""}: {skill.awakening_bonus}
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {hero.imprint_passive && (
                      <div className="flex items-start gap-3 rounded-lg border border-border p-4 bg-card">
                        {imprintImageUrl ? (
                          <img src={imprintImageUrl} alt="Imprint Passive" className="h-10 w-10 rounded-full object-cover flex-shrink-0 border-2 border-border" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center border-2 border-border">
                            <Stamp className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <h3 className="font-display font-bold uppercase tracking-wide text-sm">Imprint Passive</h3>
                            <span className="text-xs text-muted-foreground font-semibold uppercase">(Passive)</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: preprocessMarkup(hero.imprint_passive) }} />
                        </div>
                      </div>
                    )}
                    {hero.divinity_generator && (
                      <div className="rounded-lg border border-border p-4 bg-card">
                        <div className="flex items-baseline gap-2 mb-1">
                          <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                          <h3 className="font-display font-bold uppercase tracking-wide text-sm">Divinity Generator</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: preprocessMarkup(hero.divinity_generator) }} />
                      </div>
                    )}
                    {leaderBonus?.text && (
                      <div className="rounded-lg border border-border p-4 bg-card">
                        <div className="flex items-baseline gap-2 mb-1">
                          <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                          <h3 className="font-display font-bold uppercase tracking-wide text-sm">Leader Bonus</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{leaderBonus.text}</p>
                        {leaderBonus.scope && <p className="text-xs text-muted-foreground/70 mt-1">{leaderBonus.scope}</p>}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ===== BELOW THE FOLD: Masonry-style sections ===== */}
            {/* Skills row first (full width) */}
            {hasBuilds && skills && skills.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-display font-semibold mb-4">Hero Skills</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {skills.map((skill) => (
                      <Link key={skill.id} to={`/database/skills/${skill.slug}`} className="flex items-start gap-3 rounded-lg border border-border p-4 hover:border-primary/30 transition-colors group bg-card">
                        {skill.image_url && (
                          <img src={skill.image_url} alt={skill.name} className="h-10 w-10 rounded-full object-cover flex-shrink-0 border-2 border-border group-hover:border-primary/40 transition-colors" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                            <h3 className="font-display font-bold uppercase tracking-wide text-sm">{skill.name}</h3>
                            <span className="text-xs text-muted-foreground font-semibold uppercase">({skill.skill_type})</span>
                          </div>
                          {skill.scaling_formula && (
                            <span className="text-xs text-primary font-mono block mb-1">{skill.scaling_formula}</span>
                          )}
                          {skill.description && <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: preprocessMarkup(skill.description) }} />}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(skill.effects as string[] || []).map((effect: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{effect}</Badge>
                            ))}
                            {skill.ultimate_cost && (
                              <Badge variant="outline" className="text-xs">Cost: {skill.ultimate_cost}</Badge>
                            )}
                          </div>
                          {skill.awakening_bonus && (
                            <p className="text-xs text-primary/80 mt-1">
                              <Star className="inline h-3 w-3 mr-1" />
                              Awakening {skill.awakening_level || ""}: {skill.awakening_bonus}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                    {/* Imprint Passive as a skill-style card */}
                    {hero.imprint_passive && (
                      <div className="flex items-start gap-3 rounded-lg border border-border p-4 bg-card">
                        {imprintImageUrl ? (
                          <img src={imprintImageUrl} alt="Imprint Passive" className="h-10 w-10 rounded-full object-cover flex-shrink-0 border-2 border-border" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center border-2 border-border">
                            <Stamp className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <h3 className="font-display font-bold uppercase tracking-wide text-sm">Imprint Passive</h3>
                            <span className="text-xs text-muted-foreground font-semibold uppercase">(Passive)</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: preprocessMarkup(hero.imprint_passive) }} />
                        </div>
                      </div>
                    )}
                    {/* Divinity Generator as a skill-style card */}
                    {hero.divinity_generator && (
                      <div className="rounded-lg border border-border p-4 bg-card">
                        <div className="flex items-baseline gap-2 mb-1">
                          <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                          <h3 className="font-display font-bold uppercase tracking-wide text-sm">Divinity Generator</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: preprocessMarkup(hero.divinity_generator) }} />
                      </div>
                    )}
                    {/* Leader Bonus as a skill-style card */}
                    {leaderBonus?.text && (
                      <div className="rounded-lg border border-border p-4 bg-card">
                        <div className="flex items-baseline gap-2 mb-1">
                          <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                          <h3 className="font-display font-bold uppercase tracking-wide text-sm">Leader Bonus</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{leaderBonus.text}</p>
                        {leaderBonus.scope && <p className="text-xs text-muted-foreground/70 mt-1">{leaderBonus.scope}</p>}
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Other sections — masonry multi-column layout */}
            <div className="columns-1 md:columns-2 xl:columns-3 2xl:columns-4 gap-6 mb-8 [&>div]:break-inside-avoid [&>div]:mb-6">

              {/* Community Sentiment Card */}
              {sentiment && (
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                    <MessageSquare className="h-24 w-24 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-display font-semibold">Community Sentiment</h2>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{sentiment.summary}</p>
                  
                  {sentiment.pros && sentiment.pros.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Pros</h3>
                      <ul className="space-y-1.5">
                        {sentiment.pros.map((pro: string, idx: number) => (
                          <li key={idx} className="text-xs flex items-start gap-2 text-muted-foreground">
                            <span className="text-green-500 font-bold">✓</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {sentiment.cons && sentiment.cons.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Cons</h3>
                      <ul className="space-y-1.5">
                        {sentiment.cons.map((con: string, idx: number) => (
                          <li key={idx} className="text-xs flex items-start gap-2 text-muted-foreground">
                            <span className="text-red-500 font-bold">✗</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {sentiment.last_updated && (
                    <p className="text-[10px] text-muted-foreground/60 italic mt-6">
                      Last updated: {sentiment.last_updated}
                    </p>
                  )}
                </div>
              )}

              {/* Ascension Bonuses */}
              {ascensionBonuses.length > 0 && (
                <div>
                  <h2 className="text-lg font-display font-semibold mb-3">Ascension Bonuses</h2>
                  <div className="space-y-2">
                    {ascensionBonuses.map((ab) => (
                      <div key={ab.tier} className="flex items-center gap-3 rounded-lg border border-border p-3 bg-card">
                        <span className="text-primary font-bold text-sm w-6">{ab.tier}★</span>
                        <p className="text-sm text-muted-foreground">{ab.bonus}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Awakening Bonuses */}
              {awakeningBonuses.length > 0 && (
                <div>
                  <h2 className="text-lg font-display font-semibold mb-3">Awakening Bonuses</h2>
                  <div className="space-y-2">
                    {awakeningBonuses.map((ab) => {
                      const romanNumerals: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
                      return (
                        <div key={ab.tier} className="flex items-center gap-3 rounded-lg border border-border p-3 bg-card">
                          <span className="text-primary font-bold text-sm w-6">{romanNumerals[ab.tier] || ab.tier}</span>
                          <p className="text-sm text-muted-foreground">{ab.bonus}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lore */}
              {hero.lore && (
                <div>
                  <h2 className="text-lg font-display font-semibold mb-3">Lore</h2>
                  <div className="rounded-lg border border-border p-4 bg-card">
                    <p className="text-sm text-muted-foreground leading-relaxed italic">{hero.lore}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Version History */}
            {versions && versions.length > 0 && (
              <div className="mt-8">
                <Collapsible open={versionOpen} onOpenChange={setVersionOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <History className="h-4 w-4" />
                    <span>Version History ({versions.length})</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="space-y-2 border border-border rounded-lg p-4 bg-card/50">
                      {versions.map((v: any, index: number) => {
                        const vPrev = versions[index + 1];
                        const summary = getChangeSummary(v, vPrev);
                        return (
                          <div key={v.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className="text-xs mt-0.5">v{v.version_number}</Badge>
                              <div className="flex flex-col">
                                <span className="text-foreground capitalize font-medium">{v.change_source}</span>
                                {summary && (
                                  <span className="text-xs text-muted-foreground/70 mt-0.5">{summary}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-muted-foreground text-xs whitespace-nowrap ml-4">
                              {format(new Date(v.created_at), "MMM d, yyyy HH:mm")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

/* ── Sub-components ── */

function AttributeIcon({ label, name, iconUrl }: { label: string; name: string; iconUrl?: string | null }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center gap-1 cursor-default">
          <div className="h-12 w-12 rounded-lg border border-border bg-card flex items-center justify-center overflow-hidden hover:border-primary/40 transition-colors">
            {iconUrl ? (
              <img src={iconUrl} alt={name} className="h-8 w-8 object-contain" />
            ) : (
              <span className="text-xs font-bold text-muted-foreground uppercase">{name?.charAt(0)}</span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}