import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Zap } from "lucide-react";
import { SEO } from "@/components/SEO";

const typeColors: Record<string, string> = {
  buff: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  debuff: "bg-red-500/10 text-red-400 border-red-500/20",
  disable: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function MechanicDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: mechanic, isLoading } = useQuery({
    queryKey: ["mechanic", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mechanics")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 max-w-2xl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Layout>
    );
  }

  if (!mechanic) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Mechanic not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title={`${mechanic.name} — Mechanic`} description={mechanic.description || `Details about ${mechanic.name}`} />
      <div className="container py-8 max-w-2xl">
        <Link to="/database/mechanics" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Mechanics
        </Link>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              {mechanic.icon_url ? (
                <img src={mechanic.icon_url} alt={mechanic.name} className="h-16 w-16 rounded object-contain" />
              ) : (
                <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                  <Zap className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="font-display text-2xl font-bold">{mechanic.name}</h1>
                <Badge variant="outline" className={`mt-1 ${typeColors[mechanic.mechanic_type] || ""}`}>
                  {mechanic.mechanic_type}
                </Badge>
              </div>
            </div>

            {mechanic.description && (
              <p className="text-muted-foreground leading-relaxed">{mechanic.description}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
