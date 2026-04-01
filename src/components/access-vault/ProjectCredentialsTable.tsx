import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { KeyRound, Plus, ClipboardPaste, Eye, EyeOff, Copy, Edit, Trash2, Loader2, Check } from "lucide-react";
import { useAccessVault } from "@/hooks/useAccessVault";
import { NewAccessVaultEntry } from "@/types/access-vault";
import { ParsedCredential } from "@/lib/parseCredentials";
import { SmartPasteDialog } from "./SmartPasteDialog";
import { EditAccessVaultDialog } from "./EditAccessVaultDialog";
import { AccessVaultEntry } from "@/types/access-vault";

interface ProjectCredentialsTableProps {
  projectId: number;
}

export function ProjectCredentialsTable({ projectId }: ProjectCredentialsTableProps) {
  const { entries, isLoading, addEntry, addEntries, updateEntry, deleteEntry } = useAccessVault(projectId);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<AccessVaultEntry | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSmartInsert = async (parsed: ParsedCredential[]) => {
    const newEntries: NewAccessVaultEntry[] = parsed
      .filter(e => e.service_name.trim())
      .map(e => ({
        service_name: e.service_name,
        category: 'other' as const,
        project_id: projectId,
        username: e.username || undefined,
        password: e.password || undefined,
        url: e.url || undefined,
        notes: e.notes || undefined,
      }));

    if (newEntries.length > 0) {
      await addEntries(newEntries);
    }
  };

  const handleQuickAdd = async () => {
    await addEntry({
      service_name: "Novo Serviço",
      category: "other",
      project_id: projectId,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover esta credencial?")) {
      await deleteEntry(id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" />
              Credenciais de Serviço
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPasteOpen(true)}>
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Colar Acessos
              </Button>
              <Button size="sm" onClick={handleQuickAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <KeyRound className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Nenhuma credencial cadastrada.</p>
              <p className="text-sm mt-1">Cole seus acessos para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Senha</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Obs</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {entry.service_name}
                      </TableCell>
                      <TableCell>
                        {entry.username ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm truncate max-w-[150px]">{entry.username}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => copyToClipboard(entry.username!, `user-${entry.id}`)}
                            >
                              {copiedField === `user-${entry.id}` ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.password ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-mono truncate max-w-[120px]">
                              {visiblePasswords.has(entry.id) ? entry.password : "••••••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => togglePassword(entry.id)}
                            >
                              {visiblePasswords.has(entry.id) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => copyToClipboard(entry.password!, `pass-${entry.id}`)}
                            >
                              {copiedField === `pass-${entry.id}` ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.url ? (
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline truncate block max-w-[180px]"
                          >
                            {entry.url.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground truncate block max-w-[120px]">
                          {entry.notes || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditEntry(entry)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <SmartPasteDialog
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onInsert={handleSmartInsert}
      />

      {editEntry && (
        <EditAccessVaultDialog
          entry={editEntry}
          open={!!editEntry}
          onClose={() => setEditEntry(null)}
          onSave={updateEntry}
        />
      )}
    </>
  );
}
