import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewsPage from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import ComingSoonPage from "./pages/ComingSoon";
import CommunityPage from "./pages/Community";
import OfficialPostsPage from "./pages/OfficialPosts";
import DatabasePage from "./pages/Database";
import BossesList from "./pages/BossesList";
import BossDetail from "./pages/BossDetail";
import BossStrategyDetail from "./pages/BossStrategyDetail";
import HeroDetail from "./pages/HeroDetail";
import HeroesList from "./pages/HeroesList";
import SkillsList from "./pages/SkillsList";
import SkillDetail from "./pages/SkillDetail";
import GuidesPage from "./pages/Guides";
import GuideDetail from "./pages/GuideDetail";
import ImprintsList from "./pages/ImprintsList";
import ImprintDetail from "./pages/ImprintDetail";
import WeaponsList from "./pages/WeaponsList";
import WeaponDetail from "./pages/WeaponDetail";
import ToolsPage from "./pages/Tools";
import TeamBuilder from "./pages/TeamBuilder";
import ChangelogPage from "./pages/Changelog";
import RoadmapPage from "./pages/Roadmap";
import AuthPage from "./pages/Auth";
import DiscordRedirect from "./pages/Discord";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHeroes from "./pages/admin/AdminHeroes";

import AdminSkills from "./pages/admin/AdminSkills";
import AdminMechanics from "./pages/admin/AdminMechanics";
import MechanicsList from "./pages/MechanicsList";
import MechanicDetail from "./pages/MechanicDetail";
import AdminNews from "./pages/admin/AdminNews";
import AdminGuides from "./pages/admin/AdminGuides";
import AdminOfficialPosts from "./pages/admin/AdminOfficialPosts";
import AdminChangelog from "./pages/admin/AdminChangelog";
import AdminRoadmap from "./pages/admin/AdminRoadmap";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminPlatform from "./pages/admin/AdminPlatform";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDocs from "./pages/admin/AdminDocs";
import AdminImprints from "./pages/admin/AdminImprints";
import AdminWeapons from "./pages/admin/AdminWeapons";
import AdminFactions from "./pages/admin/AdminFactions";
import AdminArchetypes from "./pages/admin/AdminArchetypes";
import AdminAffinities from "./pages/admin/AdminAffinities";
import AdminAllegiances from "./pages/admin/AdminAllegiances";
import AdminAuthors from "./pages/admin/AdminAuthors";
import AdminBuilds from "./pages/admin/AdminBuilds";
import AdminArmorSets from "./pages/admin/AdminArmorSets";
import ArmorSetsList from "./pages/ArmorSetsList";
import AdminBosses from "./pages/admin/AdminBosses";
import AdminBossStrategies from "./pages/admin/AdminBossStrategies";
import AdminSeo from "./pages/admin/AdminSeo";
import AdminTeamComps from "./pages/admin/AdminTeamComps";
import BuildDetail from "./pages/BuildDetail";
import { FeedbackWidget } from "./components/FeedbackWidget";
import { usePageView } from "./hooks/usePageView";

const queryClient = new QueryClient();

function PageViewTracker() {
  usePageView();
  return null;
}

const comingSoon = (title: string, desc: string) => (
  <ComingSoonPage title={title} description={desc} />
);

function AppRoutes() {
  const { flags } = useFeatureFlags();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/news/:slug" element={<NewsDetail />} />

      {/* Database */}
      <Route
        path="/database"
        element={flags.database ? <DatabasePage /> : comingSoon("Database", "The full heroes, items, skills, and materials database is under construction.")}
      />
      <Route
        path="/database/heroes"
        element={flags.database ? <HeroesList /> : comingSoon("Database", "The full heroes, items, skills, and materials database is under construction.")}
      />
      <Route
        path="/database/heroes/:slug"
        element={flags.database ? <HeroDetail /> : comingSoon("Database", "The full heroes, items, skills, and materials database is under construction.")}
      />
      <Route
        path="/database/skills"
        element={flags.database ? <SkillsList /> : comingSoon("Database", "The full heroes, items, skills, and materials database is under construction.")}
      />
      <Route
        path="/database/skills/:slug"
        element={flags.database ? <SkillDetail /> : comingSoon("Database", "The full heroes, items, skills, and materials database is under construction.")}
      />

      {/* Mechanics */}
      <Route
        path="/database/mechanics"
        element={flags.database ? <MechanicsList /> : comingSoon("Database", "The full database is under construction.")}
      />
      <Route
        path="/database/mechanics/:slug"
        element={flags.database ? <MechanicDetail /> : comingSoon("Database", "The full database is under construction.")}
      />

      {/* Imprints */}
      <Route path="/database/imprints" element={flags.database ? <ImprintsList /> : comingSoon("Database", "The full database is under construction.")} />
      <Route path="/database/imprints/:slug" element={flags.database ? <ImprintDetail /> : comingSoon("Database", "The full database is under construction.")} />

      {/* Weapons */}
      <Route path="/database/weapons" element={flags.database ? <WeaponsList /> : comingSoon("Database", "The full database is under construction.")} />
      <Route path="/database/weapons/:slug" element={flags.database ? <WeaponDetail /> : comingSoon("Database", "The full database is under construction.")} />

      {/* Armor Sets */}
      <Route path="/database/armor-sets" element={flags.database ? <ArmorSetsList /> : comingSoon("Database", "The full database is under construction.")} />

      {/* Builds */}
      <Route path="/database/heroes/:heroSlug/builds/:buildSlug" element={flags.database ? <BuildDetail /> : comingSoon("Database", "The full database is under construction.")} />

      {/* Bosses */}
      <Route path="/bosses" element={<BossesList />} />
      <Route path="/bosses/:slug" element={<BossDetail />} />
      <Route path="/bosses/:bossSlug/strategies/:strategySlug" element={<BossStrategyDetail />} />

      {/* Guides */}
      <Route
        path="/guides"
        element={flags.guides ? <GuidesPage /> : comingSoon("Guides", "Community guides and strategies are being prepared.")}
      />
      <Route
        path="/guides/:slug"
        element={flags.guides ? <GuideDetail /> : comingSoon("Guides", "Community guides and strategies are being prepared.")}
      />

      {/* Tools */}
      <Route
        path="/tools"
        element={flags.tools ? <ToolsPage /> : comingSoon("Tools", "Interactive tools like tier lists, team builder, and resource calculators are in development.")}
      />
      <Route path="/tools/team-builder" element={<TeamBuilder />} />

      {/* Community */}
      <Route
        path="/community"
        element={flags.community ? <CommunityPage /> : comingSoon("Community", "The community hub is being set up.")}
      />

      {/* Official Posts */}
      <Route path="/official-posts" element={<OfficialPostsPage />} />

      <Route path="/discord" element={<DiscordRedirect />} />
      <Route path="/changelog" element={<ChangelogPage />} />
      <Route path="/roadmap" element={<RoadmapPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/analytics" replace />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="heroes" element={<AdminHeroes />} />
        <Route path="builds" element={<AdminBuilds />} />
        <Route path="armor-sets" element={<AdminArmorSets />} />
        <Route path="bosses" element={<AdminBosses />} />
        <Route path="boss-strategies" element={<AdminBossStrategies />} />

        <Route path="skills" element={<AdminSkills />} />
        <Route path="mechanics" element={<AdminMechanics />} />
        <Route path="imprints" element={<AdminImprints />} />
        <Route path="weapons" element={<AdminWeapons />} />
        <Route path="factions" element={<AdminFactions />} />
        <Route path="archetypes" element={<AdminArchetypes />} />
        <Route path="affinities" element={<AdminAffinities />} />
        <Route path="allegiances" element={<AdminAllegiances />} />
        <Route path="news" element={<AdminNews />} />
        <Route path="guides" element={<AdminGuides />} />
        <Route path="official-posts" element={<AdminOfficialPosts />} />
        <Route path="authors" element={<AdminAuthors />} />
        <Route path="changelog" element={<AdminChangelog />} />
        <Route path="roadmap" element={<AdminRoadmap />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="seo" element={<AdminSeo />} />
        <Route path="team-comps" element={<AdminTeamComps />} />
        <Route path="platform" element={<AdminPlatform />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="docs" element={<AdminDocs />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
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
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
