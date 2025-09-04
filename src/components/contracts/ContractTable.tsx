
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditIcon, TrashIcon, PlusIcon, FileText, CheckIcon, Grid, List, Copy, Eye, ExternalLink, Shield } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { formatCurrency } from "@/components/payments/utils/formatUtils";
import { formatDate } from "@/utils/formatters";
import { Contract } from "@/types/contract";
import { NewContractDialog } from "./NewContractDialog";
import { EditContractDialog } from "./EditContractDialog";
import { SignContractDialog } from "./SignContractDialog";
import { ContractDetailsDialog } from "./ContractDetailsDialog";
import { NDADialog } from "./NDADialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const getStatusColor = (status?: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "suspended":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
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
  const [generatingContract, setGeneratingContract] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [ndaDialogOpen, setNdaDialogOpen] = useState(false);
  const { toast } = useToast();

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

  const handleGenerateContract = async (contract: Contract) => {
    setGeneratingContract(contract.id);
    
    const payload = {
      contract: {
        id: contract.id,
        client_name: contract.clients?.name,
        scope: contract.scope,
        total_value: contract.total_value,
        installments: contract.installments,
        installment_value: contract.installment_value,
        start_date: contract.start_date,
        end_date: contract.end_date,
        status: contract.status
      },
      timestamp: new Date().toISOString(),
      action: "generate_contract"
    };

    console.log("Enviando solicitação via edge function");
    console.log("Payload:", payload);
    
    try {
      const response = await fetch(`https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/generate-contract-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHB2cGR3Z2l3YmRwcWhlZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTA5NzEsImV4cCI6MjA1NTc2Njk3MX0.gljQ6JAfbMzP-cbA68Iz21vua9YqAqVQgpB-eLk6nAg'}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Success response:", result);

      toast({
        title: "Solicitação enviada",
        description: "A solicitação para gerar o contrato foi enviada com sucesso.",
      });
    } catch (error) {
      console.error("Erro completo:", error);
      
      toast({
        title: "Erro",
        description: `Não foi possível enviar a solicitação para gerar o contrato. ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setGeneratingContract(null);
    }
  };

  const handleCreateContract = async (contractData: Contract) => {
    try {
      // Chama o webhook do n8n diretamente (igual ao GitHub)
      const webhookResponse = await fetch("https://n8n.sof.to/webhook-test/e39a39a2-b53d-4cda-b3cb-c526da442158", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract: contractData,
          timestamp: new Date().toISOString(),
          action: "create_contract"
        }),
      });

      if (webhookResponse.ok) {
        toast({
          title: "Webhook enviado",
          description: "O webhook foi chamado com sucesso para o novo contrato.",
        });
      } else {
        console.warn("Webhook não foi enviado com sucesso, mas o contrato foi criado");
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
          <div className="flex items-center gap-3">
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
            
            <Button 
              onClick={() => setNdaDialogOpen(true)}
              variant="outline"
            >
              <Shield className="h-4 w-4 mr-2" />
              Enviar NDA
            </Button>
            
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
                    <TableHead className="w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.clients?.name || "Cliente não vinculado"}
                      </TableCell>
                      <TableCell>{contract.scope || "-"}</TableCell>
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
                        <Badge className={getStatusColor(contract.status)}>
                          {getStatusLabel(contract.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingContract(contract)}
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopySigningLink(contract.contract_id)}
                            title="Copiar Link de Assinatura"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSigningPage(contract.contract_id)}
                            title="Abrir Página de Assinatura"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          {contract.status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSigningContract(contract)}
                              title="Marcar como Assinado"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateContract(contract)}
                            disabled={generatingContract === contract.id}
                            title="Gerar Contrato"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingContract(contract)}
                            title="Editar"
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contract.id)}
                            title="Excluir"
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
          ) : (
            // Visualização em Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contracts.map((contract) => (
                <Card key={contract.id} className="hover:shadow-lg transition-shadow h-80 flex flex-col">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex justify-between items-start min-h-0">
                      <div className="min-w-0 flex-1 mr-2">
                        <CardTitle className="text-lg truncate" title={contract.clients?.name || "Cliente não vinculado"}>
                          {contract.clients?.name || "Cliente não vinculado"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          ID: {contract.id}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(contract.status)} flex-shrink-0`}>
                        {getStatusLabel(contract.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
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
                    <div className="flex-shrink-0 pt-3 border-t">
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
                          onClick={() => handleCopySigningLink(contract.contract_id)}
                          title="Copiar Link de Assinatura"
                          className="h-8 px-2"
                        >
                          <Copy className="h-4 w-4" />
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
                          onClick={() => handleGenerateContract(contract)}
                          disabled={generatingContract === contract.id}
                          title="Gerar Contrato"
                          className="h-8 px-2"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        
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

      <NDADialog
        open={ndaDialogOpen}
        onClose={() => setNdaDialogOpen(false)}
      />
    </>
  );
}
