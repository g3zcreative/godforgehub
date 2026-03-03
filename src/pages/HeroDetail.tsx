import { useParams, Link } from "react-router-dom";
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
};

const rarityStars = (r: number) => "★".repeat(r) + "☆".repeat(Math.max(0, 5 - r));

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
      <div className="container max-w-3xl py-8">
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
              description={hero.description || `${hero.name} - ${hero.rarity}★ ${hero.element} ${hero.class_type}`}
              image={hero.image_url || undefined}
              url={`/database/heroes/${hero.slug}`}
              jsonLd={{
                "@context": "https://schema.org",
                "@type": "Thing",
                name: hero.name,
                description: hero.description || `${hero.name} - ${hero.rarity}★ ${hero.element} ${hero.class_type}`,
                ...(hero.image_url ? { image: hero.image_url } : {}),
                additionalType: "GameCharacter",
              }}
            />
            <div className="flex items-center gap-3 mb-4">
              {hero.image_url && (
                <img src={hero.image_url} alt={hero.name} className="h-20 w-20 rounded-lg object-cover" />
              )}
              <div>
                <h1 className="text-3xl font-display font-bold">{hero.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={elementColors[hero.element] || ""}>{hero.element}</Badge>
                  <Badge variant="outline">{hero.class_type}</Badge>
                  <span className="text-primary text-sm">{rarityStars(hero.rarity)}</span>
                </div>
              </div>
            </div>

            {hero.description && (
              <p className="text-muted-foreground mb-6">{hero.description}</p>
            )}

            {stats && Object.keys(stats).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-display font-semibold mb-3">Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(stats).map(([key, val]) => (
                    <div key={key} className="rounded-lg border border-border p-3 text-center">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">{key}</span>
                      <p className="text-xl font-bold text-primary">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {skills && skills.length > 0 && (
              <div>
                <h2 className="text-xl font-display font-semibold mb-3">Skills</h2>
                <div className="space-y-3">
                  {skills.map((skill) => (
                    <div key={skill.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{skill.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{skill.skill_type}</Badge>
                          {skill.cooldown && <span className="text-xs text-muted-foreground">{skill.cooldown}s CD</span>}
                        </div>
                      </div>
                      {skill.description && <p className="text-sm text-muted-foreground">{skill.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
