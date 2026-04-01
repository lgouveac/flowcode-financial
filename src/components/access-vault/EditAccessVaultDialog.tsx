import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { AccessVaultEntry, ACCESS_VAULT_CATEGORY_LABELS, AccessVaultCategory } from "@/types/access-vault";

interface EditAccessVaultDialogProps {
  entry: AccessVaultEntry;
  open: boolean;
  onClose: () => void;
  onSave: (args: { id: string; updates: Partial<AccessVaultEntry> }) => Promise<void>;
}

export function EditAccessVaultDialog({ entry, open, onClose, onSave }: EditAccessVaultDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    service_name: "",
    category: "other" as AccessVaultCategory,
    url: "",
    username: "",
    password: "",
    notes: "",
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        service_name: entry.service_name,
        category: (entry.category as AccessVaultCategory) || "other",
        url: entry.url || "",
        username: entry.username || "",
        password: entry.password || "",
        notes: entry.notes || "",
      });
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service_name) return;

    try {
      await onSave({
        id: entry.id,
        updates: {
          service_name: formData.service_name,
          category: formData.category,
          url: formData.url || undefined,
          username: formData.username || undefined,
          password: formData.password || undefined,
          notes: formData.notes || undefined,
        },
      });
      setShowPassword(false);
      onClose();
    } catch (error) {
      console.error("Error updating entry:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Acesso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_service_name">Serviço *</Label>
              <Input
                id="edit_service_name"
                required
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                placeholder="Ex: Vercel, Supabase, GitHub"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as AccessVaultCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCESS_VAULT_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_url">URL</Label>
            <Input
              id="edit_url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://dashboard.exemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_username">Usuário / Email</Label>
              <Input
                id="edit_username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="usuario@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_password">Senha / Token</Label>
              <div className="relative">
                <Input
                  id="edit_password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_notes">Notas</Label>
            <Textarea
              id="edit_notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais sobre este acesso..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
