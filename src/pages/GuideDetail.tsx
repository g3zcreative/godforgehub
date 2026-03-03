import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import MDEditor from "@uiw/react-md-editor";
import { SEO } from "@/components/SEO";

export default function GuideDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: guide, isLoading } = useQuery({
    queryKey: ["guide", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guides")
        .select("*")
        .eq("slug", slug!)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  return (
    <Layout>
      <div className="container max-w-3xl py-8">
        <Link to="/guides" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Guides
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !guide ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-display font-bold mb-2">Guide not found</h1>
            <p className="text-muted-foreground">This guide may have been removed or isn't published yet.</p>
          </div>
        ) : (
          <>
            <SEO
              title={guide.title}
              description={guide.excerpt || undefined}
              type="article"
            />
            <Badge variant="outline" className="mb-3">{guide.category}</Badge>
            <h1 className="text-3xl font-display font-bold mb-2">{guide.title}</h1>
            <p className="text-sm text-muted-foreground mb-6">
              by {guide.author}
              {guide.published_at && ` · ${format(new Date(guide.published_at), "PPP")}`}
            </p>
            {guide.content && (
              <div data-color-mode="dark">
                <MDEditor.Markdown source={guide.content} className="!bg-transparent !text-foreground" />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
