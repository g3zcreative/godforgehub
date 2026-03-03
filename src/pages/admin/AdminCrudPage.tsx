import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export interface ColumnConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "boolean" | "json";
  required?: boolean;
  showInTable?: boolean;
  editable?: boolean;
}

interface AdminCrudPageProps {
  tableName: string;
  title: string;
  columns: ColumnConfig[];
}

type RowData = Record<string, unknown>;

export function AdminCrudPage({ tableName, title, columns }: AdminCrudPageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const [formData, setFormData] = useState<RowData>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const editableColumns = columns.filter(c => c.editable !== false);
  const tableColumns = columns.filter(c => c.showInTable !== false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [tableName],
    queryFn: async () => {
      const { data, error } = await (supabase.from(tableName as any) as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as RowData[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (row: RowData) => {
      if (editingRow) {
        const { error } = await (supabase.from(tableName as any) as any).update(row).eq("id", editingRow.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from(tableName as any) as any).insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
      setDialogOpen(false);
      setEditingRow(null);
      setFormData({});
      toast({ title: editingRow ? "Updated" : "Created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from(tableName as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
      setDeleteId(null);
      toast({ title: "Deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingRow(null);
    const defaults: RowData = {};
    editableColumns.forEach(c => {
      if (c.type === "boolean") defaults[c.key] = false;
      else if (c.type === "number") defaults[c.key] = 0;
      else if (c.type === "json") defaults[c.key] = "{}";
      else defaults[c.key] = "";
    });
    setFormData(defaults);
    setDialogOpen(true);
  };

  const openEdit = (row: RowData) => {
    setEditingRow(row);
    const data: RowData = {};
    editableColumns.forEach(c => {
      const val = row[c.key];
      if (c.type === "json") data[c.key] = JSON.stringify(val ?? {}, null, 2);
      else data[c.key] = val ?? "";
    });
    setFormData(data);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload: RowData = {};
    editableColumns.forEach(c => {
      let val = formData[c.key];
      if (c.type === "number") val = Number(val);
      else if (c.type === "json") {
        try { val = JSON.parse(val as string); } catch { val = {}; }
      }
      payload[c.key] = val;
    });
    saveMutation.mutate(payload);
  };

  const renderField = (col: ColumnConfig) => {
    const value = formData[col.key];
    if (col.type === "boolean") {
      return (
        <div key={col.key} className="flex items-center gap-2">
          <Switch checked={!!value} onCheckedChange={v => setFormData(p => ({ ...p, [col.key]: v }))} />
          <Label>{col.label}</Label>
        </div>
      );
    }
    if (col.type === "textarea" || col.type === "json") {
      return (
        <div key={col.key} className="space-y-1">
          <Label>{col.label}</Label>
          <Textarea rows={col.type === "json" ? 6 : 4} value={String(value ?? "")} onChange={e => setFormData(p => ({ ...p, [col.key]: e.target.value }))} />
        </div>
      );
    }
    return (
      <div key={col.key} className="space-y-1">
        <Label>{col.label}</Label>
        <Input
          type={col.type === "number" ? "number" : "text"}
          value={String(value ?? "")}
          onChange={e => setFormData(p => ({ ...p, [col.key]: e.target.value }))}
          required={col.required}
        />
      </div>
    );
  };

  const displayValue = (row: RowData, col: ColumnConfig) => {
    const val = row[col.key];
    if (val === null || val === undefined) return "—";
    if (col.type === "boolean") return val ? "Yes" : "No";
    if (col.type === "json") return "{ ... }";
    const s = String(val);
    return s.length > 60 ? s.slice(0, 60) + "…" : s;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">{title}</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">No records yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.map(c => <TableHead key={c.key}>{c.label}</TableHead>)}
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id as string}>
                  {tableColumns.map(c => <TableCell key={c.key}>{displayValue(row, c)}</TableCell>)}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id as string)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit" : "Create"} {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editableColumns.map(renderField)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
