import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "route_path", label: "Route Path", required: true },
  { key: "meta_title", label: "Meta Title" },
  { key: "meta_description", label: "Meta Description", type: "textarea" },
  { key: "updated_at", label: "Updated", type: "datetime", editable: false, showInTable: true },
];

export default function AdminSeo() {
  return (
    <AdminCrudPage
      tableName="page_seo"
      title="SEO Overrides"
      columns={columns}
    />
  );
}
