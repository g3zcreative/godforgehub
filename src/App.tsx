import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewsPage from "./pages/News";
import DatabasePage from "./pages/Database";
import GuidesPage from "./pages/Guides";
import ToolsPage from "./pages/Tools";
import CommunityPage from "./pages/Community";
import ChangelogPage from "./pages/Changelog";
import RoadmapPage from "./pages/Roadmap";
import AuthPage from "./pages/Auth";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHeroes from "./pages/admin/AdminHeroes";
import AdminItems from "./pages/admin/AdminItems";
import AdminSkills from "./pages/admin/AdminSkills";
import AdminMaterials from "./pages/admin/AdminMaterials";
import AdminNews from "./pages/admin/AdminNews";
import AdminGuides from "./pages/admin/AdminGuides";
import AdminOfficialPosts from "./pages/admin/AdminOfficialPosts";
import AdminChangelog from "./pages/admin/AdminChangelog";
import AdminRoadmap from "./pages/admin/AdminRoadmap";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/database" element={<DatabasePage />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/heroes" replace />} />
              <Route path="heroes" element={<AdminHeroes />} />
              <Route path="items" element={<AdminItems />} />
              <Route path="skills" element={<AdminSkills />} />
              <Route path="materials" element={<AdminMaterials />} />
              <Route path="news" element={<AdminNews />} />
              <Route path="guides" element={<AdminGuides />} />
              <Route path="official-posts" element={<AdminOfficialPosts />} />
              <Route path="changelog" element={<AdminChangelog />} />
              <Route path="roadmap" element={<AdminRoadmap />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
