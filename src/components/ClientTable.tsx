import { PlusIcon, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NewClientForm } from "./client/NewClientForm";
import { ClientRow } from "./client/ClientRow";
import { EditClientDialog } from "./EditClientDialog";
import { ImportCSV } from "./import/ImportCSV";
import { ShareFormButton } from "./client/ShareFormButton";
import { SimplePaymentDialog } from "./recurring-billing/SimplePaymentDialog";
import type { Client, NewClient } from "@/types/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableBody } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const ClientTable = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const {
    toast
  } = useToast();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const fetchClients = async () => {
    const {
      data,
      error
    } = await supabase.from('clients').select('*');
    if (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive"
      });
      return;
    }
    setClients(data || []);
  };
  useEffect(() => {
    fetchClients();
  }, []);
  const handleChange = async (id: string, field: keyof Client, value: string | number) => {
    const {
      error
    } = await supabase.from('clients').update({
      [field]: value
    }).eq('id', id);
    if (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente.",
        variant: "destructive"
      });
      return;
    }
    setClients(prevClients => prevClients.map(client => client.id === id ? {
      ...client,
      [field]: value
    } : client));
    toast({
      title: "Sucesso",
      description: "Cliente atualizado com sucesso."
    });
  };
  const handleNewClient = async (client: NewClient) => {
    // Explicitly type the object being inserted to match the database schema and fixed types
    const newClient: any = {
      ...client,
      status: client.status || 'active',
      total_billing: client.total_billing || 0,
      responsible_name: client.responsible_name || null
    };
    const {
      data,
      error
    } = await supabase.from('clients').insert([newClient]).select();
    if (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente.",
        variant: "destructive"
      });
      return;
    }
    setClients(prev => [...prev, data[0]]);
    toast({
      title: "Cliente adicionado",
      description: "O novo cliente foi cadastrado com sucesso."
    });
  };
  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowEditDialog(true);
  };
  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteDialog(true);
  };
  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      // Verificar se há pagamentos relacionados ao cliente
      const {
        data: payments,
        error: paymentsError
      } = await supabase.from('payments').select('id').eq('client_id', clientToDelete.id).limit(1);
      if (paymentsError) {
        throw new Error(`Erro ao verificar pagamentos: ${paymentsError.message}`);
      }

      // Verificar se há cobranças recorrentes relacionadas ao cliente
      const {
        data: billings,
        error: billingsError
      } = await supabase.from('recurring_billing').select('id').eq('client_id', clientToDelete.id).limit(1);
      if (billingsError) {
        throw new Error(`Erro ao verificar cobranças recorrentes: ${billingsError.message}`);
      }

      // Se existem pagamentos ou cobranças, não permitimos a exclusão
      if (payments && payments.length > 0 || billings && billings.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este cliente possui pagamentos ou cobranças recorrentes associados. Remova-os primeiro.",
          variant: "destructive"
        });
        return;
      }

      // Excluir o cliente
      const {
        error: deleteError
      } = await supabase.from('clients').delete().eq('id', clientToDelete.id);
      if (deleteError) {
        throw new Error(`Erro ao excluir cliente: ${deleteError.message}`);
      }

      // Atualizar a lista de clientes
      setClients(clients.filter(client => client.id !== clientToDelete.id));
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso."
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o cliente.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setClientToDelete(null);
    }
  };
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.email.toLowerCase().includes(searchTerm.toLowerCase()) || client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const handlePaymentSuccess = () => {
    toast({
      title: "Sucesso",
      description: "Recebimento criado com sucesso."
    });
  };
  return <div className="space-y-4 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex flex-wrap w-full sm:w-auto gap-2">
          <ImportCSV />
          <ShareFormButton />
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
              <NewClientForm onSubmit={handleNewClient} onClose={() => document.querySelector<HTMLButtonElement>('[role="dialog"] button[type="button"]')?.click()} />
            </DialogContent>
          </Dialog>
          
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input 
            placeholder="Buscar clientes..." 
            className="pl-9" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="overdue">Inadimplentes</SelectItem>
          </SelectContent>
        </Select>
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
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <TableBody>
              {filteredClients.map(client => <ClientRow key={client.id} client={client} onUpdate={handleChange} onClick={() => handleClientClick(client)} onDelete={handleDeleteClient} />)}
            </TableBody>
          </table>
        </div>
      </div>

      <EditClientDialog client={selectedClient} open={showEditDialog} onClose={() => setShowEditDialog(false)} onSuccess={fetchClients} />
      
      {/* Dialog for creating a new payment */}
      <SimplePaymentDialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} onSuccess={handlePaymentSuccess} clients={clients} />
      
      {/* Diálogo de confirmação para excluir cliente */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{clientToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteClient} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
