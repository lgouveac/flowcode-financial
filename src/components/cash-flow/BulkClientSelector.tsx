import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { X, Users } from "lucide-react";

interface Client {
  id: string;
  name: string;
}

interface BulkClientSelectorProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onApplySuccess: () => void;
}

export function BulkClientSelector({ selectedIds, onClearSelection, onApplySuccess }: BulkClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedClientId) {
      toast({
        title: "Cliente obrigatório",
        description: "Por favor, selecione um cliente.",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);
    try {
      const { error } = await supabase
        .from('cash_flow')
        .update({ client_id: selectedClientId })
        .in('id', selectedIds);

      if (error) throw error;

      const clientName = clients.find(c => c.id === selectedClientId)?.name || "Cliente";
      
      toast({
        title: "Sucesso!",
        description: `${selectedIds.length} ${selectedIds.length > 1 ? 'entradas foram atualizadas' : 'entrada foi atualizada'} com o cliente "${clientName}".`,
      });

      onApplySuccess();
      onClearSelection();
      setSelectedClientId("");
    } catch (error) {
      console.error('Erro ao atualizar entradas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as entradas selecionadas.",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 bg-background border rounded-lg p-4 mb-4 shadow-md">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span className="font-medium">
            {selectedIds.length} {selectedIds.length > 1 ? 'itens selecionados' : 'item selecionado'}
          </span>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <div className="flex-1 min-w-48">
            <Select 
              value={selectedClientId} 
              onValueChange={setSelectedClientId}
              disabled={loading || applying}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolher cliente..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {loading ? (
                  <SelectItem value="loading" disabled>
                    Carregando...
                  </SelectItem>
                ) : clients.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Nenhum cliente encontrado
                  </SelectItem>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleApply}
              disabled={!selectedClientId || applying}
              className="bg-primary hover:bg-primary/90"
            >
              {applying ? "Aplicando..." : "Aplicar"}
            </Button>
            
            <Button
              variant="outline"
              onClick={onClearSelection}
              disabled={applying}
              size="icon"
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}