import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { DatabaseBreadcrumb } from "@/components/DatabaseBreadcrumb";

const ITEMS_PER_PAGE = 24;

const realmColors: Record<string, string> = {
  Tian: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Aaru: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  Olympus: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Asgard: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Izumo: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Avalon: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Ekur: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Omeyocan: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  Vyraj: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Eternal: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const rarityStars = (r: number) => "★".repeat(r) + "☆".repeat(Math.max(0, 5 - r));

const rarityOptions = [
  { value: "5", label: "★★★★★ Legendary" },
  { value: "4", label: "★★★★☆ Epic" },
  { value: "3", label: "★★★☆☆ Rare" },
  { value: "2", label: "★★☆☆☆ Uncommon" },
  { value: "1", label: "★☆☆☆☆ Common" },
];

export default function HeroesList() {
  const [search, setSearch] = useState("");
  const [realmFilter, setRealmFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: heroes, isLoading } = useQuery({
    queryKey: ["heroes_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("heroes")
        .select("*, factions(name), archetypes(name)")
        .order("rarity", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data || []).map((h: any) => ({
        ...h,
        faction_name: h.factions?.name || "Unknown",
        archetype_name: h.archetypes?.name || "Unknown",
      }));
    },
  });

  // Load reference tables for filter options
  const { data: factionsList = [] } = useQuery({
    queryKey: ["ref_factions_list"],
    queryFn: async () => {
      const { data } = await supabase.from("factions").select("id, name").order("name");
      return (data || []) as { id: string; name: string }[];
    },
  });
  const { data: archetypesList = [] } = useQuery({
    queryKey: ["ref_archetypes_list"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("archetypes").select("id, name").order("name");
      return (data || []) as { id: string; name: string }[];
    },
  });

  const realms = useMemo(() => {
    if (factionsList.length > 0) return factionsList.map(f => f.name);
    if (!heroes) return [];
    return [...new Set(heroes.map((h: any) => h.faction_name))].filter(Boolean).sort();
  }, [heroes, factionsList]);

  const classes = useMemo(() => {
    if (archetypesList.length > 0) return archetypesList.map(a => a.name);
    if (!heroes) return [];
    return [...new Set(heroes.map((h: any) => h.archetype_name))].filter(Boolean).sort();
  }, [heroes, archetypesList]);

  const filtered = useMemo(() => {
    if (!heroes) return [];
    return heroes.filter((h: any) => {
      if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (realmFilter !== "all" && h.faction_name.toLowerCase() !== realmFilter.toLowerCase()) return false;
      if (classFilter !== "all" && h.archetype_name.toLowerCase() !== classFilter.toLowerCase()) return false;
      if (rarityFilter !== "all" && h.rarity !== Number(rarityFilter)) return false;
      return true;
    });
  }, [heroes, search, realmFilter, classFilter, rarityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const hasActiveFilters = search || realmFilter !== "all" || classFilter !== "all" || rarityFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setRealmFilter("all");
    setClassFilter("all");
    setRarityFilter("all");
    setPage(1);
  };

  return (
    <Layout>
      <SEO title="Heroes Database" description="Browse all heroes in Godforge — filter by realm, class, and rarity." url="/database/heroes" />
      <div className="container py-8">
        <DatabaseBreadcrumb segments={[{ label: "Heroes" }]} />

        <h1 className="font-display text-3xl font-bold mb-6">Heroes</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search heroes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={realmFilter} onValueChange={(v) => { setRealmFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Realm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Realms</SelectItem>
              {realms.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rarityFilter} onValueChange={(v) => { setRarityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              {rarityOptions.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0" title="Clear filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4">{filtered.length} hero{filtered.length !== 1 ? "es" : ""} found</p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : paged.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paged.map((hero) => (
              <Link key={hero.id} to={`/database/heroes/${hero.slug}`}>
                <Card className="hover:border-primary/30 transition-colors h-full group">
                  <CardContent className="p-4 flex items-center gap-3">
                    {hero.image_url ? (
                      <img
                        src={hero.image_url}
                        alt={hero.name}
                        className="h-14 w-14 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-xs">?</div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold truncate">{hero.name}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <Badge variant="outline" className={`text-xs ${realmColors[hero.faction_name] || ""}`}>{hero.faction_name}</Badge>
                        <Badge variant="outline" className="text-xs">{hero.archetype_name}</Badge>
                      </div>
                      <span className="text-primary text-xs mt-1 block">{rarityStars(hero.rarity)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No heroes match your filters.</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
