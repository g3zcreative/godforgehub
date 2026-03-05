import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";

const columns: ColumnConfig[] = [
  { key: "name", label: "Name", required: true, showInTable: true },
  { key: "slug", label: "Slug", required: true, showInTable: true },
  { key: "skill_type", label: "Type", type: "select", required: true, showInTable: true, options: [
    { value: "Basic", label: "Basic" },
    { value: "Core", label: "Core" },
    { value: "Ultimate", label: "Ultimate" },
    { value: "Passive", label: "Passive" },
    { value: "Leader", label: "Leader" },
  ]},
  { key: "cooldown", label: "Cooldown", type: "number", showInTable: true },
  { key: "description", label: "Description", type: "textarea" },
  { key: "hero_id", label: "Hero ID" },
  { key: "image_url", label: "Image URL" },
  { key: "scaling", label: "Scaling (JSON)", type: "json" },
];

export default function AdminSkills() {
  return <AdminCrudPage tableName="skills" title="Skills" columns={columns} />;
}
