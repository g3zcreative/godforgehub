import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "name", label: "Name", required: true, showInTable: true },
  { key: "slug", label: "Slug", required: true, showInTable: true },
  { key: "description", label: "Description", type: "textarea" },
  { key: "icon_url", label: "Icon", storageBucket: "icons" },
  { key: "strength_id", label: "Strong Against", showInTable: true },
  { key: "weakness_id", label: "Weak Against", showInTable: true },
];

export default function AdminAffinities() {
  return <AdminCrudPage tableName="affinities" title="Affinities" columns={columns} />;
}
