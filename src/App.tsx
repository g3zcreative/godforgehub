import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewsPage from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import ComingSoonPage from "./pages/ComingSoon";
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
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminPlatform from "./pages/admin/AdminPlatform";
import { FeedbackWidget } from "./components/FeedbackWidget";
import { usePageView } from "./hooks/usePageView";

const queryClient = new QueryClient();

function PageViewTracker() {
  usePageView();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageViewTracker />
          <FeedbackWidget />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/database" element={<ComingSoonPage title="Database" description="The full heroes, items, skills, and materials database is under construction." />} />
            <Route path="/database/*" element={<ComingSoonPage title="Database" description="The full heroes, items, skills, and materials database is under construction." />} />
            <Route path="/guides" element={<ComingSoonPage title="Guides" description="Community guides and strategies are being prepared." />} />
            <Route path="/guides/*" element={<ComingSoonPage title="Guides" description="Community guides and strategies are being prepared." />} />
            <Route path="/tools" element={<ComingSoonPage title="Tools" description="Interactive tools like tier lists, team builder, and resource calculators are in development." />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/analytics" replace />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="heroes" element={<AdminHeroes />} />
              <Route path="items" element={<AdminItems />} />
              <Route path="skills" element={<AdminSkills />} />
              <Route path="materials" element={<AdminMaterials />} />
              <Route path="news" element={<AdminNews />} />
              <Route path="guides" element={<AdminGuides />} />
              <Route path="official-posts" element={<AdminOfficialPosts />} />
              <Route path="changelog" element={<AdminChangelog />} />
              <Route path="roadmap" element={<AdminRoadmap />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="platform" element={<AdminPlatform />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
