import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "author", label: "Author", required: true, showInTable: true },
  { key: "author_role", label: "Author Role", showInTable: true },
  { key: "source", label: "Source", showInTable: true },
  { key: "channel_name", label: "Channel Name", showInTable: true },
  { key: "content", label: "Content", type: "markdown", required: true, showInTable: true },
  { key: "message_url", label: "Message URL" },
  { key: "region", label: "Region" },
  { key: "posted_at", label: "Posted At", type: "datetime" },
];

export default function AdminOfficialPosts() {
  return (
    <AdminCrudPage
      tableName="official_posts"
      title="Official Posts"
      columns={columns}
      defaults={{ source: "Discord" }}
    />
  );
}
