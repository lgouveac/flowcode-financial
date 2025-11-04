import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { NewProject } from "@/types/project";

interface Client {
  id: string;
  name: string;
}

interface Contract {
  id: number;
  scope: string;
  client_id: string;
  total_value?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  clients?: {
    name: string;
  };
}

interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewProjectDialog = ({ open, onClose, onSuccess }: NewProjectDialogProps) => {
  const [formData, setFormData] = useState<NewProject>({
    name: "",
    description: "",
    client_id: undefined,
    contract_id: undefined,
    status: "active",
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchData();
      // Reset form when dialog opens
      setFormData({
        name: "",
        description: "",
        client_id: undefined,
        contract_id: undefined,
        status: "active",
      });
    }
  }, [open]);

  const fetchData = async () => {
    try {
      setLoadingData(true);

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (clientsError) throw clientsError;

      // Fetch contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('contratos')
        .select(`
          id,
          scope,
          client_id,
          total_value,
          start_date,
          end_date,
          status,
          clients!fk_contratos_client (
            name
          )
        `)
        .order('id', { ascending: false });

      if (contractsError) throw contractsError;

      setClients(clientsData || []);
      setContracts(contractsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do projeto.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // If a contract is selected, set the client_id from the contract
      const finalData = { ...formData };
      if (formData.contract_id) {
        const selectedContract = contracts.find(c => c.id === formData.contract_id);
        if (selectedContract) {
          finalData.client_id = selectedContract.client_id;
        }
      }

      const { error } = await supabase
        .from('projetos')
        .insert([finalData]);

      if (error) throw error;

      toast({
        title: "Projeto criado",
        description: "O projeto foi criado com sucesso.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Erro ao criar projeto",
        description: error.message || "Ocorreu um erro ao criar o projeto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedContract = contracts.find(c => c.id === formData.contract_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome do projeto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição opcional do projeto"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract">Contrato (Opcional)</Label>
            <Select
              value={formData.contract_id?.toString() || "none"}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  contract_id: value !== "none" ? parseInt(value) : undefined,
                  client_id: undefined // Reset client when contract changes
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar contrato existente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum contrato</SelectItem>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id.toString()}>
                    {contract.scope || `Contrato #${contract.id}`}
                    {contract.clients && ` - ${contract.clients.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!formData.contract_id && (
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select
                value={formData.client_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, client_id: value !== "none" ? value : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedContract && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="border-b border-border pb-2 mb-3">
                <h4 className="font-semibold text-sm">Informações do Contrato</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Cliente:</span>
                  <p className="mt-1">{selectedContract.clients?.name}</p>
                </div>

                <div>
                  <span className="font-medium text-muted-foreground">Escopo:</span>
                  <p className="mt-1">{selectedContract.scope || "Não informado"}</p>
                </div>


                {selectedContract.status && (
                  <div>
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <p className="mt-1 capitalize">{selectedContract.status}</p>
                  </div>
                )}

                {selectedContract.start_date && (
                  <div>
                    <span className="font-medium text-muted-foreground">Data Início:</span>
                    <p className="mt-1">{new Date(selectedContract.start_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}

                {selectedContract.end_date && (
                  <div>
                    <span className="font-medium text-muted-foreground">Data Fim:</span>
                    <p className="mt-1">{new Date(selectedContract.end_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>

            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'paused' | 'completed') =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || loadingData}>
              {loading ? "Criando..." : "Criar Projeto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};