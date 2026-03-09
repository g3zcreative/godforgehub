import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";

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
  const [sitemapXml, setSitemapXml] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const regenerateSitemap = async () => {
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/sitemap`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      setSitemapXml(xml);
      toast.success(`Sitemap generated with ${(xml.match(/<url>/g) || []).length} URLs`);
    } catch (err: any) {
      toast.error("Failed to generate sitemap: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(sitemapXml);
    setCopied(true);
    toast.success("Sitemap XML copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Regenerate Sitemap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a fresh <code className="bg-muted px-1 rounded">sitemap.xml</code> from the database. Copy the output and share it to update the static file at <code className="bg-muted px-1 rounded">public/sitemap.xml</code>.
          </p>
          <div className="flex gap-2">
            <Button onClick={regenerateSitemap} disabled={loading} variant="outline">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Generating..." : "Generate Sitemap"}
            </Button>
            {sitemapXml && (
              <Button onClick={copyToClipboard} variant="outline">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied!" : "Copy XML"}
              </Button>
            )}
          </div>
          {sitemapXml && (
            <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-96 whitespace-pre-wrap">
              {sitemapXml}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
