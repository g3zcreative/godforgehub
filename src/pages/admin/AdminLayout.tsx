import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  Shield, Swords, Package, Sparkles, FlaskConical, Newspaper,
  BookOpen, MessageSquare, FileText, Map, LogOut, MessageCircle, BarChart3,
  RefreshCw, Users, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const contentItems = [
  { title: "Heroes", url: "/admin/heroes", icon: Shield },
  { title: "Items", url: "/admin/items", icon: Package },
  { title: "Skills", url: "/admin/skills", icon: Sparkles },
  { title: "Materials", url: "/admin/materials", icon: FlaskConical },
  { title: "News", url: "/admin/news", icon: Newspaper },
  { title: "Guides", url: "/admin/guides", icon: BookOpen },
  { title: "Official Posts", url: "/admin/official-posts", icon: MessageSquare },
  { title: "Changelog", url: "/admin/changelog", icon: FileText },
  { title: "Roadmap", url: "/admin/roadmap", icon: Map },
];

const insightItems = [
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Feedback", url: "/admin/feedback", icon: MessageCircle },
];

const platformItems = [
  { title: "Users", url: "/admin/platform", icon: Users },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto p-4 border-t border-border">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={async () => { await signOut(); navigate("/"); }}>
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sign Out"}
        </Button>
      </div>
    </Sidebar>
  );
}

function AdminHeader() {
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenSitemap = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/sitemap`
      );
      if (!res.ok) throw new Error("Failed to fetch sitemap");
      const xml = await res.text();
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sitemap.xml";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Sitemap downloaded — replace public/sitemap.xml with it");
    } catch {
      toast.error("Failed to regenerate sitemap");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <header className="h-12 flex items-center border-b border-border px-4 gap-4">
      <SidebarTrigger />
      <span className="font-display font-bold text-sm">GodforgeHub Admin</span>
      <div className="ml-auto">
        <Button variant="outline" size="sm" onClick={handleRegenSitemap} disabled={regenerating}>
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? "Generating..." : "Regenerate Sitemap"}
        </Button>
      </div>
    </header>
  );
}

export default function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  if (authLoading || adminLoading) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-display font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You need admin privileges to access this area.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
