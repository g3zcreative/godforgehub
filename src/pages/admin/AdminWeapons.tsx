import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "name", label: "Name", required: true, showInTable: true },
  { key: "slug", label: "Slug", required: true, showInTable: true },
  { key: "passive", label: "Passive", type: "textarea" },
  { key: "rank", label: "Rank", type: "number", required: true, showInTable: true },
  { key: "imprint_id", label: "Imprint ID" },
  { key: "rarity", label: "Rarity", type: "select", required: true, showInTable: true, options: [
    { value: "Rare", label: "Rare" },
    { value: "Epic", label: "Epic" },
    { value: "Legendary", label: "Legendary" },
  ]},
  { key: "faction", label: "Faction", showInTable: true },
  { key: "image_url", label: "Image URL" },
];

export default function AdminWeapons() {
  return <AdminCrudPage tableName="weapons" title="Weapons" columns={columns} />;
}
