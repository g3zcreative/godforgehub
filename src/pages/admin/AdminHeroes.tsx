import { useState } from "react";
import { AdminCrudPage, ColumnConfig } from "./AdminCrudPage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const columns: ColumnConfig[] = [
  { key: "name", label: "Name", required: true, showInTable: true },
  { key: "subtitle", label: "Subtitle" },
  { key: "slug", label: "Slug", required: true, showInTable: true },
  { key: "element", label: "Realm", required: true, showInTable: true },
  { key: "class_type", label: "Archetype", required: true, showInTable: true },
  { key: "affinity", label: "Affinity", showInTable: true },
  { key: "allegiance", label: "Allegiance", showInTable: true },
  { key: "realm", label: "Realm/Pantheon" },
  { key: "rarity", label: "Rarity", type: "number", required: true, showInTable: true },
  { key: "description", label: "Description", type: "textarea" },
  { key: "lore", label: "Lore", type: "textarea" },
  { key: "image_url", label: "Image URL" },
  { key: "stats", label: "Stats (JSON)", type: "json" },
];

type CreationMode = "picker" | "url" | null;

export default function AdminHeroes() {
  const [mode, setMode] = useState<CreationMode>(null);
  const [importUrl, setImportUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, unknown> | undefined>();
  const [triggerCreate, setTriggerCreate] = useState(0);
  const { toast } = useToast();

  const openPicker = () => setMode("picker");

  const importFromUrl = async () => {
    if (!importUrl.trim()) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-hero", {
        body: { url: importUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Also auto-create skills if returned
      const skills = data.skills || [];

      setDefaults({
        name: data.name || "",
        subtitle: data.subtitle || "",
        slug: data.slug || "",
        element: data.element || "",
        class_type: data.class_type || "",
        affinity: data.affinity || "",
        allegiance: data.allegiance || "",
        realm: data.realm || "",
        rarity: data.rarity ?? 5,
        description: data.description || "",
        lore: data.lore || "",
        image_url: data.image_url || "",
        stats: JSON.stringify(data.stats || {}, null, 2),
      });
      setTriggerCreate(t => t + 1);
      setMode(null);
      setImportUrl("");
      
      const skillNote = skills.length > 0 ? ` ${skills.length} skills found — they'll be added after you save the hero.` : "";
      toast({ title: "Hero imported!", description: `Review and edit before saving.${skillNote}` });
      
      // Store skills temporarily for after hero is saved
      if (skills.length > 0) {
        (window as any).__pendingHeroSkills = skills;
      }
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <AdminCrudPage
        tableName="heroes"
        title="Heroes"
        columns={columns}
        defaults={defaults}
        onNewOverride={openPicker}
        triggerCreate={triggerCreate}
      />

      {/* Mode Picker */}
      <Dialog open={mode === "picker"} onOpenChange={open => !open && setMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Hero</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setMode("url")}>
              <Link className="h-6 w-6" />
              <span className="text-sm">Import from URL</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => { setDefaults(undefined); setTriggerCreate(t => t + 1); setMode(null); }}>
              <Plus className="h-6 w-6" />
              <span className="text-sm">Blank</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import from URL */}
      <Dialog open={mode === "url"} onOpenChange={open => { if (!open && !isGenerating) setMode(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Hero from URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Hero page URL</Label>
              <Input
                type="url"
                placeholder="https://godforge.gg/heroes/sun-wukong"
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Paste a link to a hero page on godforge.gg. Data will be scraped and extracted automatically.</p>
            </div>
            <Button className="w-full" onClick={importFromUrl} disabled={isGenerating || !importUrl.trim()}>
              {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : <><Link className="mr-2 h-4 w-4" /> Import Hero</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
