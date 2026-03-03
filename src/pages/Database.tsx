import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Sword, Shield, Zap, Gem, Map, Trophy, Database as DatabaseIcon } from "lucide-react";
import { databaseCategories, mockHeroes, elementColors, rarityStars } from "@/data/mock-data";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const iconMap: Record<string, React.ReactNode> = {
  Sword: <Sword className="h-8 w-8" />,
  Shield: <Shield className="h-8 w-8" />,
  Zap: <Zap className="h-8 w-8" />,
  Gem: <Gem className="h-8 w-8" />,
  Map: <Map className="h-8 w-8" />,
  Trophy: <Trophy className="h-8 w-8" />,
};

const DatabasePage = () => {
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
          <DatabaseIcon className="h-7 w-7 text-primary" /> Database
        </h1>
        <p className="text-muted-foreground mb-8">Browse all game data — heroes, equipment, skills, and more.</p>

        {/* Categories grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {databaseCategories.map((cat) => (
            <Link key={cat.id} to={cat.href}>
              <Card className="hover:border-primary/40 transition-all h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="text-primary">{iconMap[cat.icon]}</div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                    <span className="text-xs text-muted-foreground">{cat.count} entries</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Featured Heroes preview */}
        <h2 className="font-display text-2xl font-bold mb-4">Featured Heroes</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockHeroes.map((hero) => (
            <Card key={hero.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-semibold text-lg">{hero.name}</h3>
                  <span className="text-primary text-sm">{rarityStars[hero.rarity]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={elementColors[hero.element]}>
                    {hero.element}
                  </Badge>
                  <Badge variant="outline">{hero.classType}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default DatabasePage;
