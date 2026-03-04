import { useParams, Link } from "react-router-dom";
import { preprocessMarkup } from "@/lib/guide-markup";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";

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
      return data;
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
      return data;
    },
    enabled: !!hero?.id,
  });

  const stats = hero?.stats as Record<string, number> | null;

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

            {/* Two-column layout: left content, right hero image */}
            <div className="relative flex flex-col md:flex-row gap-6 mb-8 overflow-visible">
              {/* Left: info + skills */}
              <div className="flex-1 min-w-0">
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
                  <p className="text-muted-foreground leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: preprocessMarkup(hero.description) }} />
                )}

                {/* Skills */}
                {skills && skills.length > 0 && (
                  <div className="mt-2">
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
                            </div>
                            {skill.description && <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: preprocessMarkup(skill.description) }} />}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: hero portrait - overflows container */}
              {hero.image_url && (
                <div className="flex-shrink-0 md:w-64 lg:w-80 relative md:sticky md:top-20 md:self-start">
                  <img
                    src={hero.image_url}
                    alt={hero.name}
                    className="w-full md:-mt-12 md:-mb-8 relative z-10"
                    style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))" }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
