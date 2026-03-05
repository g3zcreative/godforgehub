import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

export default function AdminImprints() {
  const { data: heroes = [] } = useQuery({
    queryKey: ["heroes_for_select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("heroes")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const heroOptions = heroes.map((h) => ({ value: h.id, label: h.name }));

  const columns: ColumnConfig[] = [
    { key: "name", label: "Name", required: true, showInTable: true },
    { key: "slug", label: "Slug", required: true, showInTable: true },
    { key: "passive", label: "Passive", type: "textarea" },
    { key: "source_hero_id", label: "Source Hero", type: "select", options: heroOptions, showInTable: true },
    { key: "rarity", label: "Rarity", type: "number", required: true, showInTable: true },
    { key: "image_url", label: "Image URL" },
  ];

  return <AdminCrudPage tableName="imprints" title="Imprints" columns={columns} />;
}
