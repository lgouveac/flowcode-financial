import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Copy, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AccessVaultEntry, ACCESS_VAULT_CATEGORY_LABELS, ACCESS_VAULT_CATEGORY_COLORS, AccessVaultCategory } from "@/types/access-vault";

interface AccessVaultCardProps {
  entry: AccessVaultEntry;
  onEdit: (entry: AccessVaultEntry) => void;
  onDelete: (id: string) => void;
}

export function AccessVaultCard({ entry, onEdit, onDelete }: AccessVaultCardProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copiado`, description: "Copiado para a área de transferência." });
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const categoryLabel = ACCESS_VAULT_CATEGORY_LABELS[entry.category as AccessVaultCategory] || entry.category;
  const categoryColor = ACCESS_VAULT_CATEGORY_COLORS[entry.category as AccessVaultCategory] || "bg-gray-100 text-gray-800";

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{entry.service_name}</h3>
            <Badge variant="secondary" className={`mt-1 text-xs ${categoryColor}`}>
              {categoryLabel}
            </Badge>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(entry)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(entry.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* URL */}
        {entry.url && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary truncate flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
              {entry.url}
            </a>
          </div>
        )}

        {/* Username */}
        {entry.username && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate">
              <span className="font-medium">Usuário:</span> {entry.username}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => copyToClipboard(entry.username!, "Usuário")}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Password */}
        {entry.password && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate">
              <span className="font-medium">Senha:</span>{" "}
              {showPassword ? entry.password : "••••••••"}
            </span>
            <div className="flex gap-0.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(entry.password!, "Senha")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Notes */}
        {entry.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2 border-t pt-2">
            {entry.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
