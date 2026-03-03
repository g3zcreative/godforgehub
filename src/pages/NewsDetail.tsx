import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock } from "lucide-react";
import { format } from "date-fns";
import MDEditor from "@uiw/react-md-editor";
import { SEO } from "@/components/SEO";

const categoryColors: Record<string, string> = {
  "Patch Notes": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Events: "bg-green-500/10 text-green-400 border-green-500/20",
  Updates: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Dev Updates": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Community: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Announcements: "bg-primary/10 text-primary border-primary/20",
};

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading } = useQuery({
    queryKey: ["news_article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
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
        <Link to="/news" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to News
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !article ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-display font-bold mb-2">Article not found</h1>
            <p className="text-muted-foreground">This article may have been removed or isn't published yet.</p>
          </div>
        ) : (
          <>
            <SEO
              title={article.title}
              description={article.excerpt || undefined}
              image={article.image_url || undefined}
              type="article"
            />
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={categoryColors[article.category] || ""}>
                {article.category}
              </Badge>
              {article.published_at && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {format(new Date(article.published_at), "PPP")}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-display font-bold mb-6">{article.title}</h1>
            {article.image_url && (
              <img src={article.image_url} alt={article.title} className="w-full rounded-lg mb-6 object-cover max-h-80" />
            )}
            {article.content && (
              <div data-color-mode="dark">
                <MDEditor.Markdown source={article.content} className="!bg-transparent !text-foreground" />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
