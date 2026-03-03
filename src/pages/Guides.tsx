import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { mockGuides } from "@/data/mock-data";
import { Link } from "react-router-dom";

const GuidesPage = () => {
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" /> Guides
        </h1>
        <p className="text-muted-foreground mb-6">Community guides and strategies for Godforge.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {mockGuides.map((guide) => (
            <Card key={guide.id} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit text-xs">{guide.category}</Badge>
                <CardTitle className="text-lg">
                  <Link to={`/guides/${guide.slug}`} className="hover:text-primary transition-colors">
                    {guide.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{guide.excerpt}</p>
                <p className="text-xs text-muted-foreground mt-3">by {guide.author} · {guide.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default GuidesPage;
