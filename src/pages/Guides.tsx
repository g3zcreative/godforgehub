import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const GuidesPage = () => {
  const { data: guides, isLoading } = useQuery({
    queryKey: ["guides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guides")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" /> Guides
        </h1>
        <p className="text-muted-foreground mb-6">Community guides and strategies for Godforge.</p>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
          </div>
        ) : guides && guides.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {guides.map((guide) => (
              <Card key={guide.id} className="hover:border-primary/30 transition-colors overflow-hidden">
                <Link to={`/guides/${guide.slug}`} className="group">
                  {(guide as any).image_url && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={(guide as any).image_url}
                        alt={guide.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit text-xs">{guide.category}</Badge>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {guide.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {guide.excerpt && <p className="text-sm text-muted-foreground">{guide.excerpt}</p>}
                    <p className="text-xs text-muted-foreground mt-3">
                      by {guide.author}
                      {guide.published_at && ` · ${new Date(guide.published_at).toLocaleDateString()}`}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No guides yet. Check back soon!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default GuidesPage;
