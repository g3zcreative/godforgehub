import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, MessageSquare, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { name: "Official Discord", url: "#", icon: <MessageSquare className="h-5 w-5" />, description: "Join the official Godforge community on Discord." },
  { name: "Reddit Community", url: "#", icon: <Users2 className="h-5 w-5" />, description: "Discuss strategies, share builds, and connect with players." },
  { name: "Twitter / X", url: "#", icon: <ExternalLink className="h-5 w-5" />, description: "Follow @GodforgeGame for the latest announcements." },
];

const CommunityPage = () => {
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
          <Users2 className="h-7 w-7 text-primary" /> Community
        </h1>
        <p className="text-muted-foreground mb-6">Connect with the Godforge community.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <Card key={link.name} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-6 flex flex-col gap-3">
                <div className="text-primary">{link.icon}</div>
                <h3 className="font-display font-semibold text-lg">{link.name}</h3>
                <p className="text-sm text-muted-foreground">{link.description}</p>
                <Button variant="outline" size="sm" className="w-fit mt-auto" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    Visit <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CommunityPage;
