import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "title", label: "Title", required: true, showInTable: true },
  { key: "slug", label: "Slug", required: true, showInTable: true },
  { key: "category", label: "Category", showInTable: true },
  { key: "published", label: "Published", type: "boolean", showInTable: true },
  { key: "excerpt", label: "Excerpt", type: "textarea" },
  { key: "content", label: "Content", type: "markdown" },
  { key: "image_url", label: "Image URL" },
  { key: "published_at", label: "Published At", type: "datetime" },
];

export default function AdminNews() {
  return <AdminCrudPage tableName="news_articles" title="News Articles" columns={columns} />;
}
