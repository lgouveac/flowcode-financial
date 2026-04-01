import { useState } from "react";
import { useAccessVault } from "@/hooks/useAccessVault";
import { AccessVaultCard } from "./AccessVaultCard";
import { EditAccessVaultDialog } from "./EditAccessVaultDialog";
import { AccessVaultEntry, ACCESS_VAULT_CATEGORY_LABELS, AccessVaultCategory } from "@/types/access-vault";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface AccessVaultListProps {
  searchTerm: string;
  categoryFilter: string;
  groupByCategory: boolean;
}

export function AccessVaultList({ searchTerm, categoryFilter, groupByCategory }: AccessVaultListProps) {
  const { entries, isLoading, updateEntry, deleteEntry } = useAccessVault();
  const [editEntry, setEditEntry] = useState<AccessVaultEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = entries.filter(entry => {
    const matchesSearch = !searchTerm || [entry.service_name, entry.username, entry.url, entry.notes]
      .some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !categoryFilter || entry.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteEntry(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {entries.length === 0
          ? "Nenhum acesso cadastrado. Clique em \"Novo Acesso\" para começar."
          : "Nenhum acesso encontrado com os filtros aplicados."}
      </div>
    );
  }

  if (groupByCategory) {
    const grouped = filtered.reduce<Record<string, AccessVaultEntry[]>>((acc, entry) => {
      const cat = entry.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(entry);
      return acc;
    }, {});

    return (
      <>
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {ACCESS_VAULT_CATEGORY_LABELS[category as AccessVaultCategory] || category}
                <span className="ml-2 text-xs font-normal">({items.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(entry => (
                  <AccessVaultCard
                    key={entry.id}
                    entry={entry}
                    onEdit={setEditEntry}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {editEntry && (
          <EditAccessVaultDialog
            entry={editEntry}
            open={!!editEntry}
            onClose={() => setEditEntry(null)}
            onSave={updateEntry}
          />
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A credencial será removida permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(entry => (
          <AccessVaultCard
            key={entry.id}
            entry={entry}
            onEdit={setEditEntry}
            onDelete={setDeleteId}
          />
        ))}
      </div>

      {editEntry && (
        <EditAccessVaultDialog
          entry={editEntry}
          open={!!editEntry}
          onClose={() => setEditEntry(null)}
          onSave={updateEntry}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A credencial será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
