import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "name", label: "Name", required: true, showInTable: true },
  { key: "slug", label: "Slug", required: true, showInTable: true },
  { key: "material_type", label: "Type", required: true, showInTable: true },
  { key: "rarity", label: "Rarity", type: "number", required: true, showInTable: true },
  { key: "description", label: "Description", type: "textarea" },
  { key: "drop_locations", label: "Drop Locations (comma-separated)" },
  { key: "image_url", label: "Image URL" },
  { key: "usage_info", label: "Usage Info", type: "textarea" },
];

export default function AdminMaterials() {
  return <AdminCrudPage tableName="materials" title="Materials" columns={columns} />;
}
