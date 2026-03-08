import AdminCrudPage, { ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "slug", label: "Slug", type: "text", required: true, autoSlugFrom: "name" },
  { key: "difficulty", label: "Difficulty", type: "select", options: ["Normal", "Hard", "Nightmare", "Legendary"] },
  { key: "location", label: "Location", type: "text" },
  { key: "hp", label: "HP", type: "text" },
  { key: "recommended_level", label: "Rec. Level", type: "number" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "lore", label: "Lore", type: "textarea", hidden: true },
  { key: "image_url", label: "Image", type: "image", bucket: "images" },
];

export default function AdminBosses() {
  return (
    <AdminCrudPage
      tableName="bosses"
      title="Bosses"
      columns={columns}
    />
  );
}
