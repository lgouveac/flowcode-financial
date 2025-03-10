
import { PlusIcon, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NewClientForm } from "./client/NewClientForm";
import { ClientRow } from "./client/ClientRow";
import { EditClientDialog } from "./EditClientDialog";
import { ImportCSV } from "./import/ImportCSV";
import type { Client, NewClient } from "@/types/client";

export const ClientTable = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*');

    if (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive",
      });
      return;
    }

    setClients(data || []);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = async (id: string, field: keyof Client, value: string | number) => {
    const { error } = await supabase
      .from('clients')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente.",
        variant: "destructive",
      });
      return;
    }

    setClients(prevClients =>
      prevClients.map(client =>
        client.id === id ? { ...client, [field]: value } : client
      )
    );
    
    toast({
      title: "Sucesso",
      description: "Cliente atualizado com sucesso.",
    });
  };

  const handleNewClient = async (client: NewClient) => {
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        ...client,
        status: client.status || 'active',
        total_billing: client.total_billing || 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente.",
        variant: "destructive",
      });
      return;
    }

    setClients(prev => [...prev, data]);
    toast({
      title: "Cliente adicionado",
      description: "O novo cliente foi cadastrado com sucesso.",
    });
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex w-full sm:w-auto gap-2">
          <ImportCSV />
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto gap-2">
                <PlusIcon className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <NewClientForm
                onSubmit={handleNewClient}
                onClose={() => document.querySelector<HTMLButtonElement>('[role="dialog"] button[type="button"]')?.click()}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:!pr-0">Nome</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Contato</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">Faturamento Total</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden lg:table-cell">Último Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onUpdate={handleChange}
                  onClick={() => handleClientClick(client)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EditClientDialog
        client={selectedClient}
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSuccess={fetchClients}
      />
    </div>
  );
};
