
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditIcon, TrashIcon, PlusIcon, FileText, CheckIcon, Grid, List, Copy, Eye, ExternalLink } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { formatCurrency } from "@/components/payments/utils/formatUtils";
import { formatDate } from "@/utils/formatters";
import { Contract } from "@/types/contract";
import { NewContractDialog } from "./NewContractDialog";
import { EditContractDialog } from "./EditContractDialog";
import { SignContractDialog } from "./SignContractDialog";
import { ContractDetailsDialog } from "./ContractDetailsDialog";
import { useWebhooks } from "@/hooks/useWebhooks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const getStatusVariant = (status?: string): "success" | "info" | "danger" | "warning" | "neutral" => {
  switch (status) {
    case "active":
      return "success";
    case "completed":
      return "info";
    case "cancelled":
      return "danger";
    case "suspended":
      return "warning";
    default:
      return "neutral";
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case "active":
      return "Ativo";
    case "completed":
      return "Concluído";
    case "cancelled":
      return "Cancelado";
    case "suspended":
      return "Suspenso";
    default:
      return "Indefinido";
  }
};

export function ContractTable() {
  const { contracts, isLoading, deleteContract } = useContracts();
  const [newContractOpen, setNewContractOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const { toast } = useToast();
  const { getWebhook } = useWebhooks();

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este contrato?")) {
      await deleteContract(id);
    }
  };

  const handleCopySigningLink = (contractId: string) => {
    const signingUrl = `${window.location.origin}/contract-signing/${contractId}`;
    navigator.clipboard.writeText(signingUrl);
    toast({
      title: "Link copiado",
      description: "Link de assinatura copiado para a área de transferência.",
    });
  };

  const handleOpenSigningPage = (contractId: string) => {
    const signingUrl = `${window.location.origin}/contract-signing/${contractId}`;
    window.open(signingUrl, '_blank');
  };



  const handleCreateContract = async (contractData: Contract) => {
    try {
      // Buscar URL do webhook dinâmico
      const webhookUrl = getWebhook('prestacao_servico', 'criacao');
      
      if (!webhookUrl || webhookUrl.trim() === '') {
        console.log('No webhook configured for contract creation');
        return;
      }
      
      console.log('Calling webhook:', webhookUrl);

      // Chama o webhook configurado dinamicamente (GET) - TODOS os dados
      const webhookParams = new URLSearchParams();
      
      // Campos básicos obrigatórios
      webhookParams.append('action', 'create_contract');
      webhookParams.append('timestamp', new Date().toISOString());
      
      // Todos os campos do contrato
      Object.entries(contractData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'clients' && typeof value === 'object') {
            // Expandir dados do cliente
            webhookParams.append('client_name', value.name || '');
            webhookParams.append('client_email', value.email || '');
            webhookParams.append('client_type', value.type || '');
          } else {
            webhookParams.append(key, value.toString());
          }
        }
      });
      
      const webhookResponse = await fetch(`${webhookUrl}?${webhookParams}`, {
        method: "GET",
      });

      if (webhookResponse.ok) {
        toast({
          title: "Webhook enviado",
          description: "O webhook foi chamado com sucesso para o novo contrato.",
        });
      }
    } catch (error) {
      console.error("Erro ao chamar webhook:", error);
      toast({
        title: "Aviso",
        description: "Contrato criado, mas houve problema ao chamar o webhook.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Carregando contratos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contratos</CardTitle>
          <div className="flex items-center gap-6">
            {/* Toggle de visualização */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="px-3 py-1"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3 py-1"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={() => setNewContractOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Nenhum contrato encontrado.</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <div className="w-full">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Escopo</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Parcelas</TableHead>
                    <TableHead>Valor da Parcela</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium w-[200px]">
                        <div className="text-sm leading-5" title={contract.clients?.name || "Cliente não vinculado"}>
                          {contract.clients?.name || (contract.contract_type === "NDA" && contract.obs?.includes("Funcionário") ? contract.obs.split(" - ")[1] : "Cliente não vinculado")}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="text-sm leading-5" title={contract.scope}>
                          <div className="line-clamp-3">
                            {contract.scope || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.total_value ? formatCurrency(contract.total_value) : "-"}
                      </TableCell>
                      <TableCell>{contract.installments || "1"}</TableCell>
                      <TableCell>
                        {contract.installment_value ? formatCurrency(contract.installment_value) : "-"}
                      </TableCell>
                      <TableCell>
                        {contract.start_date ? formatDate(new Date(contract.start_date), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(contract.status)}>
                          {getStatusLabel(contract.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 min-w-fit">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingContract(contract)}
                            title="Ver Detalhes"
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSigningPage(contract.contract_id)}
                            title="Abrir Página de Assinatura"
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          {contract.status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSigningContract(contract)}
                              title="Marcar como Assinado"
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingContract(contract)}
                            title="Editar"
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contract.id)}
                            title="Excluir"
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          ) : (
            // Visualização em Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {contracts.map((contract) => (
                <Card key={contract.id} className="hover:shadow-lg transition-shadow h-auto min-h-[320px] flex flex-col">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex justify-between items-start min-h-0">
                      <div className="min-w-0 flex-1 mr-2">
                        <CardTitle 
                          className="text-lg overflow-hidden" 
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                          title={contract.clients?.name || "Cliente não vinculado"}
                        >
                          {contract.clients?.name || (contract.contract_type === "NDA" && contract.obs?.includes("Funcionário") ? contract.obs.split(" - ")[1] : "Cliente não vinculado")}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          ID: {contract.id}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(contract.status)} className="flex-shrink-0">
                        {getStatusLabel(contract.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden p-6">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Valor Total</p>
                          <p className="font-medium truncate" title={contract.total_value ? formatCurrency(contract.total_value) : "-"}>
                            {contract.total_value ? formatCurrency(contract.total_value) : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Parcelas</p>
                          <p className="font-medium">{contract.installments || "1"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Escopo</p>
                          <p 
                            className="font-medium text-xs leading-relaxed overflow-hidden" 
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                            title={contract.scope || "-"}
                          >
                            {contract.scope || "-"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Data Início</p>
                          <p className="font-medium">
                            {contract.start_date ? formatDate(new Date(contract.start_date), "dd/MM/yyyy") : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ações - fixas no bottom */}
                    <div className="flex-shrink-0 pt-4 border-t mt-4">
                      <div className="flex flex-wrap gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingContract(contract)}
                          title="Ver Detalhes"
                          className="h-8 px-2"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenSigningPage(contract.contract_id)}
                          title="Abrir Página de Assinatura"
                          className="h-8 px-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        
                        
                        {contract.status !== "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSigningContract(contract)}
                            title="Marcar como Assinado"
                            className="h-8 px-2"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingContract(contract)}
                          title="Editar"
                          className="h-8 px-2"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contract.id)}
                          title="Excluir"
                          className="h-8 px-2"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NewContractDialog 
        open={newContractOpen} 
        onClose={() => setNewContractOpen(false)}
        onContractCreated={handleCreateContract}
      />
      
      {editingContract && (
        <EditContractDialog
          contract={editingContract}
          open={!!editingContract}
          onClose={() => setEditingContract(null)}
        />
      )}

      {signingContract && (
        <SignContractDialog
          contract={signingContract}
          open={!!signingContract}
          onClose={() => setSigningContract(null)}
        />
      )}

      {viewingContract && (
        <ContractDetailsDialog
          contract={viewingContract}
          open={!!viewingContract}
          onClose={() => setViewingContract(null)}
        />
      )}

    </>
  );
}
