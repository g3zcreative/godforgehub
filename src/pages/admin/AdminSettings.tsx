import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, Globe, ToggleLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface SeoSettings {
  site_title: string;
  site_description: string;
  og_image: string;
}

interface FeatureFlags {
  guides: boolean;
  tools: boolean;
  database: boolean;
  community: boolean;
}

function useSiteSettings<T>(key: string) {
  return useQuery({
    queryKey: ["site-settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", key)
        .single();
      if (error) throw error;
      return data.value as T;
    },
  });
}

export default function AdminSettings() {
  const queryClient = useQueryClient();

  // SEO
  const { data: seoData, isLoading: seoLoading } = useSiteSettings<SeoSettings>("seo");
  const [seo, setSeo] = useState<SeoSettings>({ site_title: "", site_description: "", og_image: "" });

  useEffect(() => {
    if (seoData) setSeo(seoData);
  }, [seoData]);

  // Feature Flags
  const { data: flagsData, isLoading: flagsLoading } = useSiteSettings<FeatureFlags>("feature_flags");
  const [flags, setFlags] = useState<FeatureFlags>({ guides: false, tools: false, database: false, community: true });

  useEffect(() => {
    if (flagsData) setFlags(flagsData);
  }, [flagsData]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: value as any, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["site-settings", key] });
      toast.success("Settings saved");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const featureFlagDescriptions: Record<keyof FeatureFlags, string> = {
    guides: "Community guides and strategies section",
    tools: "Interactive tools (tier lists, team builder, calculators)",
    database: "Full heroes, items, skills, and materials database",
    community: "Community links and social media page",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" /> Platform Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage SEO metadata and feature visibility
        </p>
      </div>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" /> SEO & Metadata
          </CardTitle>
          <CardDescription>
            Control how your site appears in search engines and social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {seoLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="site_title">Site Title</Label>
                <Input
                  id="site_title"
                  value={seo.site_title}
                  onChange={(e) => setSeo({ ...seo, site_title: e.target.value })}
                  placeholder="GodforgeHub"
                />
                <p className="text-xs text-muted-foreground">
                  {seo.site_title.length}/60 characters recommended
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_description">Meta Description</Label>
                <Textarea
                  id="site_description"
                  value={seo.site_description}
                  onChange={(e) => setSeo({ ...seo, site_description: e.target.value })}
                  placeholder="A brief description of your site..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {seo.site_description.length}/160 characters recommended
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="og_image">OG Image URL</Label>
                <Input
                  id="og_image"
                  value={seo.og_image}
                  onChange={(e) => setSeo({ ...seo, og_image: e.target.value })}
                  placeholder="https://example.com/og-image.png"
                />
              </div>
              <Button
                onClick={() => saveMutation.mutate({ key: "seo", value: seo })}
                disabled={saveMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? "Saving..." : "Save SEO Settings"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ToggleLeft className="h-5 w-5" /> Feature Flags
          </CardTitle>
          <CardDescription>
            Toggle sections on or off. Disabled sections show a "Coming Soon" page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {flagsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              {(Object.keys(flags) as (keyof FeatureFlags)[]).map((key, i, arr) => (
                <div key={key}>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium capitalize">{key}</p>
                      <p className="text-sm text-muted-foreground">
                        {featureFlagDescriptions[key]}
                      </p>
                    </div>
                    <Switch
                      checked={flags[key]}
                      onCheckedChange={(checked) =>
                        setFlags({ ...flags, [key]: checked })
                      }
                    />
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
              <div className="pt-4">
                <Button
                  onClick={() => saveMutation.mutate({ key: "feature_flags", value: flags })}
                  disabled={saveMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? "Saving..." : "Save Feature Flags"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
