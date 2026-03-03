import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "author", label: "Author", required: true, showInTable: true },
  { key: "author_role", label: "Author Role", showInTable: true },
  { key: "source", label: "Source", showInTable: true },
  { key: "content", label: "Content", type: "textarea", required: true, showInTable: true },
  { key: "region", label: "Region" },
  { key: "posted_at", label: "Posted At", type: "datetime" },
];

export default function AdminOfficialPosts() {
  return <AdminCrudPage tableName="official_posts" title="Official Posts" columns={columns} />;
}
