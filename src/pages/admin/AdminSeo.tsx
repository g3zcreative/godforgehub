import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const columns: ColumnConfig[] = [
  {
    key: "entity_type",
    label: "Entity Type",
    required: true,
    type: "select",
    options: [
      { value: "hero", label: "Hero" },
      { value: "imprint", label: "Imprint" },
      { value: "weapon", label: "Weapon" },
      { value: "skill", label: "Skill" },
    ],
  },
  { key: "title_template", label: "Title Template" },
  { key: "description_template", label: "Description Template", type: "textarea" },
  { key: "updated_at", label: "Updated", type: "datetime", editable: false, showInTable: true },
];

const variableReference: Record<string, string[]> = {
  hero: ["name", "element", "class_type", "rarity", "rarity_label", "description", "subtitle", "faction", "archetype"],
  imprint: ["name", "rarity", "rarity_label", "passive"],
  weapon: ["name", "rarity", "passive", "faction", "rank"],
  skill: ["name", "skill_type", "description"],
};

export default function AdminSeo() {
  return (
    <div className="space-y-6">
      <AdminCrudPage
        tableName="seo_templates"
        title="SEO Templates"
        columns={columns}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Template Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Use <code className="bg-muted px-1 rounded">{"{variable_name}"}</code> in your templates. They'll be replaced with the entity's actual data.
          </p>
          {Object.entries(variableReference).map(([type, vars]) => (
            <div key={type}>
              <span className="font-medium capitalize">{type}:</span>{" "}
              <span className="text-muted-foreground">
                {vars.map((v) => `{${v}}`).join(", ")}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
