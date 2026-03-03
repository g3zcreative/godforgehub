import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SeoSettings {
  siteTitle: string;
  metaDescription: string;
  ogImage: string;
}

const defaults: SeoSettings = {
  siteTitle: "GodforgeHub",
  metaDescription: "A community information hub for Godforge by Fateless Games.",
  ogImage: "",
};

export function useSeoSettings() {
  const { data } = useQuery({
    queryKey: ["site-settings", "seo_metadata"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "seo_metadata")
        .single();
      if (error) throw error;
      return data.value as unknown as SeoSettings;
    },
    staleTime: 60_000,
  });

  return data ?? defaults;
}
