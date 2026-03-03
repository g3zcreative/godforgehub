import { Link } from "react-router-dom";
import { Flame, Clock, Newspaper, BookOpen, MessageSquare, ArrowRight, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { SEO } from "@/components/SEO";

const categoryColors: Record<string, string> = {
  "Patch Notes": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Events: "bg-green-500/10 text-green-400 border-green-500/20",
  Updates: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Dev Updates": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Community: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Announcements: "bg-primary/10 text-primary border-primary/20",
};

const sourceIcons: Record<string, React.ReactNode> = {
  Discord: <MessageSquare className="h-4 w-4" />,
  Twitter: <Newspaper className="h-4 w-4" />,
  Forum: <BookOpen className="h-4 w-4" />,
};

const Index = () => {
  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ["news_home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["posts_home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("official_posts")
        .select("*")
        .order("posted_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <SEO />
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-godforge-ember/5" />
        <div className="container relative py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm">
            <Flame className="h-4 w-4" />
            Early Access — More features coming soon
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Godforge<span className="text-primary">Hub</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Your ultimate information hub for <strong className="text-foreground">Godforge</strong> by Fateless Games.
            News, official posts, roadmap, and more — all in one place.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link to="/news">Latest News</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/community">Official Posts</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Coming Soon Feature Tiles */}
      <section className="container py-10">
        <h2 className="font-display text-lg font-semibold text-muted-foreground mb-4">Coming Soon</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {["Heroes", "Items", "Skills", "Materials", "Guides"].map((name) => (
            <div
              key={name}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-border opacity-60 cursor-not-allowed"
            >
              <Lock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{name}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30 text-muted-foreground/60">Coming Soon</Badge>
            </div>
          ))}
        </div>
      </section>

      <div className="container grid lg:grid-cols-3 gap-8 pb-12">
        {/* Recent News */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" /> Recent News
            </h2>
            <Link to="/news" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {newsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {news?.map((article) => (
                <Card key={article.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={categoryColors[article.category] || ""}>
                        {article.category}
                      </Badge>
                      {article.published_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {format(new Date(article.published_at), "PPP")}
                        </span>
                      )}
                    </div>
                    <Link to={`/news/${article.slug}`} className="font-semibold hover:text-primary transition-colors line-clamp-1">
                      {article.title}
                    </Link>
                    {article.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.excerpt}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Official Post Tracker */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Post Tracker
            </h2>
            <Link to="/community" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {posts?.map((post) => (
                <Card key={post.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-primary">{sourceIcons[post.source] || <MessageSquare className="h-4 w-4" />}</span>
                      <span className="text-sm font-semibold">{post.author}</span>
                      {post.author_role && <span className="text-xs text-muted-foreground">· {post.author_role}</span>}
                    </div>
                    <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{post.source}</Badge>
                      {post.region && <span className="text-xs text-muted-foreground">{post.region}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Index;
