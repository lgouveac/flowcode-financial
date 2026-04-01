import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccessVaultList } from "@/components/access-vault/AccessVaultList";
import { NewAccessVaultDialog } from "@/components/access-vault/NewAccessVaultDialog";
import { KeyRound, Search, Plus, LayoutGrid, List } from "lucide-react";
import { ACCESS_VAULT_CATEGORY_LABELS } from "@/types/access-vault";

export default function AccessVault() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  return (
    <div className="space-section">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2">
          <KeyRound className="h-6 w-6 sm:h-5 sm:w-5" />
          Cofre de Acessos
        </h1>
        <p className="text-muted-foreground text-responsive mt-2">
          Gerencie credenciais e acessos dos seus projetos
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar acessos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full sm:w-64"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(ACCESS_VAULT_CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Group Toggle */}
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          <Button
            variant={groupByCategory ? "default" : "ghost"}
            size="sm"
            onClick={() => setGroupByCategory(true)}
            className="min-h-[44px] sm:min-h-[36px] px-3"
            title="Agrupar por categoria"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={!groupByCategory ? "default" : "ghost"}
            size="sm"
            onClick={() => setGroupByCategory(false)}
            className="min-h-[44px] sm:min-h-[36px] px-3"
            title="Lista simples"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Add Button */}
        <Button
          onClick={() => setNewDialogOpen(true)}
          className="w-full sm:w-auto touch-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Acesso
        </Button>
      </div>

      {/* List */}
      <AccessVaultList
        searchTerm={searchTerm}
        categoryFilter={categoryFilter === "all" ? "" : categoryFilter}
        groupByCategory={groupByCategory}
      />

      {/* New Dialog */}
      <NewAccessVaultDialog
        open={newDialogOpen}
        onClose={() => setNewDialogOpen(false)}
      />
    </div>
  );
}
