import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "name", label: "Name", required: true, showInTable: true },
  { key: "slug", label: "Slug", required: true, showInTable: true },
  { key: "passive", label: "Passive", type: "textarea" },
  { key: "source_hero_id", label: "Source Hero ID", showInTable: true },
  { key: "rarity", label: "Rarity", type: "number", required: true, showInTable: true },
  { key: "image_url", label: "Image URL" },
];

export default function AdminImprints() {
  return <AdminCrudPage tableName="imprints" title="Imprints" columns={columns} />;
}
