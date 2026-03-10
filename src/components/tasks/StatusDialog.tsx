import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { TaskStatus } from "@/types/task";

interface StatusDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (status: Partial<TaskStatus>) => Promise<void>;
  status?: TaskStatus | null;
  projectId?: number;
}

const colorOptions = [
  { value: "#6b7280", label: "Cinza" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#14b8a6", label: "Ciano" },
];

const iconOptions = [
  { value: "Circle", label: "Círculo" },
  { value: "CheckCircle", label: "Check" },
  { value: "PlayCircle", label: "Play" },
  { value: "Clock", label: "Relógio" },
  { value: "AlertCircle", label: "Alerta" },
  { value: "XCircle", label: "X" },
  { value: "PauseCircle", label: "Pausa" },
  { value: "StopCircle", label: "Parar" },
];

export function StatusDialog({
  open,
  onClose,
  onSave,
  status,
  projectId,
}: StatusDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6b7280");
  const [icon, setIcon] = useState("Circle");
  const [isGlobal, setIsGlobal] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status) {
      setName(status.name || "");
      setColor(status.color || "#6b7280");
      setIcon(status.icon || "Circle");
      setIsGlobal(!status.project_id);
    } else {
      setName("");
      setColor("#6b7280");
      setIcon("Circle");
      setIsGlobal(true);
    }
  }, [status, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: status?.id,
        name: name.trim(),
        color,
        icon,
        project_id: isGlobal ? undefined : projectId,
        position: status?.position || 0,
        is_default: false,
      });
      onClose();
    } catch (error) {
      console.error("Error saving status:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{status ? "Editar Status" : "Novo Status"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="statusName">Nome do Status *</Label>
            <Input
              id="statusName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Em Revisão"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="color">Cor</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: option.value }}
                        />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="icon">Ícone</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!status?.is_default && (
            <div className="flex items-center space-x-2">
              <Switch
                id="isGlobal"
                checked={isGlobal}
                onCheckedChange={setIsGlobal}
                disabled={!!status?.is_default}
              />
              <Label htmlFor="isGlobal" className="cursor-pointer">
                Status global (disponível para todos os projetos)
              </Label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}




