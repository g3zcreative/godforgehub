import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PageSeo {
  meta_title: string | null;
  meta_description: string | null;
}

export function usePageSeo(routePath: string | undefined) {
  return useQuery({
    queryKey: ["page-seo", routePath],
    queryFn: async () => {
      if (!routePath) return null;
      const { data, error } = await supabase
        .from("page_seo" as any)
        .select("meta_title, meta_description")
        .eq("route_path", routePath)
        .maybeSingle();
      if (error) throw error;
      return data as PageSeo | null;
    },
    enabled: !!routePath,
    staleTime: 5 * 60_000,
  });
}
