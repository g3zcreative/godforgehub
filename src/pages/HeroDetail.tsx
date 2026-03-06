import { useParams, Link } from "react-router-dom";
import { preprocessMarkup } from "@/lib/guide-markup";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Shield, Zap, Star, History } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { format } from "date-fns";

const elementColors: Record<string, string> = {
  Fire: "bg-red-500/10 text-red-400 border-red-500/20",
  Ice: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Wind: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Earth: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Light: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Dark: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Tian: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Duat: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  Olympus: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Asgard: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Avalon: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Ekur: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Izumo: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Omeyocan: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  Vyraj: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Aaru: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const allegianceColors: Record<string, string> = {
  Chaos: "bg-red-500/10 text-red-400 border-red-500/20",
  Order: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Balance: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

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

export default function HeroDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: hero, isLoading } = useQuery({
    queryKey: ["hero", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("heroes")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as (typeof data & {
        leader_bonus?: { text?: string; scope?: string } | null;
        divinity_generator?: string | null;
        ascension_bonuses?: { tier: number; bonus: string }[] | null;
        awakening_bonuses?: { tier: number; bonus: string }[] | null;
      }) | null;
    },
    enabled: !!slug,
  });

  const { data: skills } = useQuery({
    queryKey: ["hero_skills", hero?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("hero_id", hero!.id);
      if (error) throw error;
      return data as (typeof data[number] & {
        scaling_formula?: string | null;
        effects?: string[] | null;
        awakening_level?: number | null;
        awakening_bonus?: string | null;
        ultimate_cost?: number | null;
        initial_divinity?: number | null;
      })[];
    },
    enabled: !!hero?.id,
  });

  const { data: versions } = useQuery({
    queryKey: ["hero_versions", hero?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_versions")
        .select("id, version_number, change_source, created_at")
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


  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <Link to="/database" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Database
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !hero ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-display font-bold mb-2">Hero not found</h1>
            <p className="text-muted-foreground">This hero doesn't exist in the database.</p>
          </div>
        ) : (
          <>
            <SEO
              title={hero.name}
              description={hero.description || `${hero.name} - ${rarityLabel(hero.rarity)} ${hero.class_type}`}
              image={hero.image_url || undefined}
              url={`/database/heroes/${hero.slug}`}
              jsonLd={{
                "@context": "https://schema.org",
                "@type": "Thing",
                name: hero.name,
                description: hero.description || `${hero.name} - ${rarityLabel(hero.rarity)} ${hero.class_type}`,
                ...(hero.image_url ? { image: hero.image_url } : {}),
                additionalType: "GameCharacter",
              }}
            />

            {/* Two-column layout: left skills, right info + image */}
            <div className="relative flex flex-col md:flex-row gap-6 mb-8 overflow-visible">
              {/* Left: skills + progression */}
              <div className="flex-1 min-w-0 space-y-8">
                {/* Skills */}
                {skills && skills.length > 0 && (
                  <div>
                    <h2 className="text-xl font-display font-semibold mb-4">Hero Skills</h2>
                    <div className="space-y-4">
                      {skills.map((skill) => (
                        <Link key={skill.id} to={`/database/skills/${skill.slug}`} className="flex items-start gap-4 rounded-lg border border-border p-4 hover:border-primary/30 transition-colors group">
                          {skill.image_url && (
                            <img src={skill.image_url} alt={skill.name} className="h-12 w-12 rounded-full object-cover flex-shrink-0 border-2 border-border group-hover:border-primary/40 transition-colors" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                              <h3 className="font-display font-bold uppercase tracking-wide">{skill.name}</h3>
                              <span className="text-xs text-muted-foreground font-semibold uppercase">({skill.skill_type})</span>
                              {skill.scaling_formula && (
                                <span className="text-xs text-primary font-mono">{skill.scaling_formula}</span>
                              )}
                            </div>
                            {skill.description && <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: preprocessMarkup(skill.description) }} />}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {(skill.effects as string[] || []).map((effect, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{effect}</Badge>
                              ))}
                              {skill.ultimate_cost && (
                                <Badge variant="outline" className="text-xs">Cost: {skill.ultimate_cost}</Badge>
                              )}
                              {skill.initial_divinity && (
                                <Badge variant="outline" className="text-xs">Init Div: {skill.initial_divinity}</Badge>
                              )}
                            </div>
                            {skill.awakening_bonus && (
                              <p className="text-xs text-primary/80 mt-1">
                                <Star className="inline h-3 w-3 mr-1" />
                                Awakening {skill.awakening_level ? `${skill.awakening_level}` : ""}: {skill.awakening_bonus}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divinity Generator */}
                {hero.divinity_generator && (
                  <div>
                    <h2 className="text-xl font-display font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" /> Divinity Generator
                    </h2>
                    <div className="rounded-lg border border-border p-4 bg-card">
                      <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: preprocessMarkup(hero.divinity_generator) }} />
                    </div>
                  </div>
                )}

                {/* Leader Bonus */}
                {leaderBonus?.text && (
                  <div>
                    <h2 className="text-xl font-display font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" /> Leader Bonus
                    </h2>
                    <div className="rounded-lg border border-border p-4 bg-card">
                      <p className="text-sm font-semibold">{leaderBonus.text}</p>
                      {leaderBonus.scope && <p className="text-xs text-muted-foreground mt-1">{leaderBonus.scope}</p>}
                    </div>
                  </div>
                )}

                {/* Ascension Bonuses */}
                {ascensionBonuses.length > 0 && (
                  <div>
                    <h2 className="text-xl font-display font-semibold mb-3">Ascension Bonuses</h2>
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
                    <h2 className="text-xl font-display font-semibold mb-3">Awakening Bonuses</h2>
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
                    <h2 className="text-xl font-display font-semibold mb-3">Lore</h2>
                    <div className="rounded-lg border border-border p-4 bg-card">
                      <p className="text-sm text-muted-foreground leading-relaxed italic">{hero.lore}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: hero info + portrait */}
              <div className="flex-shrink-0 md:w-64 lg:w-80 relative md:sticky md:top-20 md:self-start">
                <div className="mb-4">
                  <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${rarityLabelColor(hero.rarity)}`}>{rarityLabel(hero.rarity)}</p>
                  <h1 className="text-4xl font-display font-bold mb-1">{hero.name}</h1>
                  {hero.subtitle && (
                    <p className="text-muted-foreground italic mb-3">— {hero.subtitle} —</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge variant="outline">{hero.class_type}</Badge>
                    <Badge variant="outline" className={elementColors[hero.element] || ""}>{hero.element}</Badge>
                    {hero.affinity && (
                      <Badge variant="outline">{hero.affinity}</Badge>
                    )}
                    {hero.allegiance && (
                      <Badge variant="outline" className={allegianceColors[hero.allegiance] || ""}>
                        {hero.allegiance}
                      </Badge>
                    )}
                    <span className="text-primary text-sm">{rarityStars(hero.rarity)}</span>
                  </div>
                  {hero.description && (
                    <p className="text-muted-foreground leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: preprocessMarkup(hero.description) }} />
                  )}
                </div>
                {hero.image_url && (
                  <img
                    src={hero.image_url}
                    alt={hero.name}
                    className="w-full md:-mb-8 relative z-10"
                    style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))" }}
                  />
                )}
              </div>
            </div>

            {/* Version History */}
            {versions && versions.length > 0 && (
              <div className="col-span-full mt-8">
                <Collapsible open={versionOpen} onOpenChange={setVersionOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <History className="h-4 w-4" />
                    <span>Version History ({versions.length})</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="space-y-2 border border-border rounded-lg p-4 bg-card/50">
                      {versions.map((v: any) => (
                        <div key={v.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">v{v.version_number}</Badge>
                            <span className="text-muted-foreground capitalize">{v.change_source}</span>
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {format(new Date(v.created_at), "MMM d, yyyy HH:mm")}
                          </span>
                        </div>
                      ))}
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
