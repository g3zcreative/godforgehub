import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Newspaper } from "lucide-react";
import { mockNews } from "@/data/mock-data";
import { Link } from "react-router-dom";

const categoryColors: Record<string, string> = {
  "Patch Notes": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Events: "bg-green-500/10 text-green-400 border-green-500/20",
  "Dev Updates": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Community: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Announcements: "bg-primary/10 text-primary border-primary/20",
};

const NewsPage = () => {
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
          <Newspaper className="h-7 w-7 text-primary" /> News
        </h1>
        <p className="text-muted-foreground mb-6">Latest updates from the world of Godforge.</p>
        <div className="space-y-3">
          {mockNews.map((article) => (
            <Card key={article.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={categoryColors[article.category] || ""}>
                    {article.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {article.date}
                  </span>
                </div>
                <Link to={`/news/${article.slug}`} className="text-lg font-semibold hover:text-primary transition-colors">
                  {article.title}
                </Link>
                <p className="text-sm text-muted-foreground mt-2">{article.excerpt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default NewsPage;
