import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "title", label: "Title", required: true, showInTable: true },
  { key: "slug", label: "Slug", required: true, showInTable: true },
  { key: "author", label: "Author", required: true, showInTable: true },
  { key: "category", label: "Category", showInTable: true },
  { key: "published", label: "Published", type: "boolean", showInTable: true },
  { key: "excerpt", label: "Excerpt", type: "textarea" },
  { key: "content", label: "Content", type: "textarea" },
  { key: "published_at", label: "Published At" },
];

export default function AdminGuides() {
  return <AdminCrudPage tableName="guides" title="Guides" columns={columns} />;
}
