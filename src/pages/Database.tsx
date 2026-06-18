import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Sword, Shield, Zap, Gem, Map, Trophy, Database as DatabaseIcon, ShieldHalf, MessageSquare, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import heroSentimentData from "@/data/hero_sentiment.json";

const elementColors: Record<string, string> = {
  Fire: "bg-red-500/10 text-red-400 border-red-500/20",
  Ice: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Wind: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Earth: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Light: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Dark: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const rarityStars = (rarity: number) => "★".repeat(rarity) + "☆".repeat(Math.max(0, 5 - rarity));

const databaseCategories = [
  { id: "heroes", name: "Heroes", description: "All playable heroes", icon: "Shield", href: "/database/heroes" },
  { id: "imprints", name: "Imprints", description: "Hero imprints & passives", icon: "Gem", href: "/database/imprints" },
  { id: "weapons", name: "Weapons", description: "All weapons & factions", icon: "Sword", href: "/database/weapons" },
  { id: "armor-sets", name: "Armor Sets", description: "Set bonuses & gear effects", icon: "ShieldHalf", href: "/database/armor-sets" },
  { id: "skills", name: "Skills", description: "Hero abilities & passives", icon: "Zap", href: "/database/skills" },
  { id: "mechanics", name: "Mechanics", description: "Buffs, debuffs & disables", icon: "Map", href: "/database/mechanics" },
];

const iconMap: Record<string, React.ReactNode> = {
  Sword: <Sword className="h-8 w-8" />,
  Shield: <Shield className="h-8 w-8" />,
  ShieldHalf: <ShieldHalf className="h-8 w-8" />,
  Zap: <Zap className="h-8 w-8" />,
  Gem: <Gem className="h-8 w-8" />,
  Map: <Map className="h-8 w-8" />,
  Trophy: <Trophy className="h-8 w-8" />,
};

const getUpdateDetails = (type: "stat" | "skill" | "sentiment", date: Date) => {
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  switch (type) {
    case "sentiment":
      return {
        icon: <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />,
        text: `Sentiment Updated: ${formattedDate}`,
        className: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      };
    case "skill":
      return {
        icon: <Zap className="h-3.5 w-3.5 text-amber-400" />,
        text: `Skills Updated: ${formattedDate}`,
        className: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      };
    case "stat":
    default:
      return {
        icon: <Activity className="h-3.5 w-3.5 text-emerald-400" />,
        text: `Stats Updated: ${formattedDate}`,
        className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      };
  }
};

const DatabasePage = () => {
  const { data: heroes, isLoading } = useQuery({
    queryKey: ["recently_updated_heroes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("heroes")
        .select(`
          id,
          name,
          slug,
          rarity,
          updated_at,
          factions(name),
          archetypes(name),
          skills(updated_at)
        `);
      if (error) throw error;

      const sentimentRecord = heroSentimentData as Record<string, { last_updated?: string }>;

      const processed = (data || []).map((h: any) => {
        const factionName = h.factions?.name || "Unknown";
        const archetypeName = h.archetypes?.name || "Unknown";

        // 1. Stat update date
        const statDate = h.updated_at ? new Date(h.updated_at) : new Date(0);

        // 2. Skills update date
        let skillDate = new Date(0);
        if (h.skills && h.skills.length > 0) {
          const skillDates = h.skills
            .map((s: any) => s.updated_at)
            .filter(Boolean)
            .map((d: string) => new Date(d));
          if (skillDates.length > 0) {
            skillDate = new Date(Math.max(...skillDates.map(d => d.getTime())));
          }
        }

        // 3. Sentiment update date
        const sentimentDateStr = sentimentRecord[h.slug]?.last_updated;
        const sentimentDate = sentimentDateStr ? new Date(sentimentDateStr) : new Date(0);

        // Determine the latest date and type
        let latestDate = statDate;
        let updateType: "stat" | "skill" | "sentiment" = "stat";

        if (skillDate > latestDate) {
          latestDate = skillDate;
          updateType = "skill";
        }
        if (sentimentDate > latestDate) {
          latestDate = sentimentDate;
          updateType = "sentiment";
        }

        return {
          id: h.id,
          name: h.name,
          slug: h.slug,
          rarity: h.rarity,
          faction_name: factionName,
          archetype_name: archetypeName,
          latest_update_date: latestDate,
          latest_update_type: updateType,
        };
      });

      // Filter out invalid dates and sort descending
      return processed
        .filter((h: any) => h.latest_update_date.getTime() > 0)
        .sort((a: any, b: any) => b.latest_update_date.getTime() - a.latest_update_date.getTime())
        .slice(0, 6);
    },
  });

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
          <DatabaseIcon className="h-7 w-7 text-primary" /> Database
        </h1>
        <p className="text-muted-foreground mb-8">Browse all game data — heroes, equipment, skills, and more.</p>

        {/* Categories grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {databaseCategories.map((cat) => (
            <Link key={cat.id} to={cat.href}>
              <Card className="hover:border-primary/40 transition-all h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="text-primary">{iconMap[cat.icon]}</div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recently Updated preview */}
        <h2 className="font-display text-2xl font-bold mb-4">Recently Updated</h2>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : heroes && heroes.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {heroes.map((hero) => {
              const updateDetails = getUpdateDetails(hero.latest_update_type, hero.latest_update_date);
              return (
                <Link key={hero.id} to={`/database/heroes/${hero.slug}`}>
                  <Card className="hover:border-primary/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:-translate-y-0.5 transition-all duration-300 h-full bg-card/60 backdrop-blur-sm border-muted-foreground/10 flex flex-col justify-between">
                    <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-display font-semibold text-lg">{hero.name}</h3>
                          <span className="text-primary text-sm">{rarityStars(hero.rarity)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={elementColors[hero.faction_name] || ""}>
                            {hero.faction_name}
                          </Badge>
                          <Badge variant="outline">{hero.archetype_name}</Badge>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border ${updateDetails.className}`}>
                        {updateDetails.icon}
                        <span className="font-medium">{updateDetails.text}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">No recently updated heroes found.</p>
        )}
      </div>
    </Layout>
  );
};

export default DatabasePage;

