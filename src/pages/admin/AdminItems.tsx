import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "name", label: "Name", required: true, showInTable: true },
  { key: "slug", label: "Slug", required: true, showInTable: true },
  { key: "item_type", label: "Type", required: true, showInTable: true },
  { key: "rarity", label: "Rarity", type: "number", required: true, showInTable: true },
  { key: "description", label: "Description", type: "textarea" },
  { key: "obtain_method", label: "Obtain Method" },
  { key: "image_url", label: "Image URL" },
  { key: "stats", label: "Stats (JSON)", type: "json" },
];

export default function AdminItems() {
  return <AdminCrudPage tableName="items" title="Items" columns={columns} />;
}
