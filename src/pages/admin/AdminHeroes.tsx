import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "name", label: "Name", required: true, showInTable: true },
  { key: "slug", label: "Slug", required: true, showInTable: true },
  { key: "element", label: "Element", required: true, showInTable: true },
  { key: "class_type", label: "Class", required: true, showInTable: true },
  { key: "rarity", label: "Rarity", type: "number", required: true, showInTable: true },
  { key: "description", label: "Description", type: "textarea" },
  { key: "image_url", label: "Image URL" },
  { key: "stats", label: "Stats (JSON)", type: "json" },
];

export default function AdminHeroes() {
  return <AdminCrudPage tableName="heroes" title="Heroes" columns={columns} />;
}
