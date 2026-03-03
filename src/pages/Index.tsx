import { Link } from "react-router-dom";
import { Flame, Clock, Newspaper, BookOpen, Sword, Shield, Zap, Gem, Map, Trophy, MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { mockNews, mockOfficialPosts, mockGuides, databaseCategories } from "@/data/mock-data";

const iconMap: Record<string, React.ReactNode> = {
  Sword: <Sword className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
  Gem: <Gem className="h-6 w-6" />,
  Map: <Map className="h-6 w-6" />,
  Trophy: <Trophy className="h-6 w-6" />,
};

const categoryColors: Record<string, string> = {
  "Patch Notes": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Events: "bg-green-500/10 text-green-400 border-green-500/20",
  "Dev Updates": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Community: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Announcements: "bg-primary/10 text-primary border-primary/20",
};

const sourceIcons: Record<string, React.ReactNode> = {
  Discord: <MessageSquare className="h-4 w-4" />,
  "Twitter/X": <Newspaper className="h-4 w-4" />,
  Forums: <BookOpen className="h-4 w-4" />,
};

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-godforge-ember/5" />
        <div className="container relative py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm">
            <Flame className="h-4 w-4" />
            Pre-Launch — Coming Soon
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Godforge<span className="text-primary">Hub</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Your ultimate information hub for <strong className="text-foreground">Godforge</strong> by Fateless Games.
            Database, guides, news, and tools — all in one place.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link to="/database">Explore Database</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/news">Latest News</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Access Categories */}
      <section className="container py-10">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {databaseCategories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-border hover:border-primary/40 hover:bg-godforge-surface-hover transition-all group"
            >
              <div className="text-muted-foreground group-hover:text-primary transition-colors">
                {iconMap[cat.icon]}
              </div>
              <span className="text-sm font-medium">{cat.name}</span>
              <span className="text-xs text-muted-foreground">{cat.count} entries</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="container grid lg:grid-cols-3 gap-8 pb-12">
        {/* Recent News — takes 2 cols */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" /> Recent News
            </h2>
            <Link to="/news" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {mockNews.slice(0, 4).map((article) => (
              <Card key={article.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={categoryColors[article.category] || ""}>
                        {article.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {article.date}
                      </span>
                    </div>
                    <Link to={`/news/${article.slug}`} className="font-semibold hover:text-primary transition-colors line-clamp-1">
                      {article.title}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.excerpt}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Official Post Tracker — sidebar */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-godforge-blue" /> Post Tracker
            </h2>
          </div>
          <div className="space-y-3">
            {mockOfficialPosts.slice(0, 4).map((post) => (
              <Card key={post.id} className="hover:border-godforge-blue/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-godforge-blue">{sourceIcons[post.source]}</span>
                    <span className="text-sm font-semibold">{post.author}</span>
                    <span className="text-xs text-muted-foreground">· {post.authorRole}</span>
                  </div>
                  <p className="text-sm text-secondary-foreground line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{post.source}</Badge>
                    {post.region && <span className="text-xs text-muted-foreground">{post.region}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Featured Guides */}
      <section className="border-t border-border bg-card/50">
        <div className="container py-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Featured Guides
            </h2>
            <Link to="/guides" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockGuides.map((guide) => (
              <Card key={guide.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="w-fit text-xs">{guide.category}</Badge>
                  <CardTitle className="text-base">
                    <Link to={`/guides/${guide.slug}`} className="hover:text-primary transition-colors">
                      {guide.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{guide.excerpt}</p>
                  <p className="text-xs text-muted-foreground mt-3">by {guide.author} · {guide.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
