
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditIcon, TrashIcon, PlusIcon, FileText } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { formatCurrency } from "@/components/payments/utils/formatUtils";
import { formatDate } from "@/utils/formatters";
import { Contract } from "@/types/contract";
import { NewContractDialog } from "./NewContractDialog";
import { EditContractDialog } from "./EditContractDialog";
import { useToast } from "@/hooks/use-toast";

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
  const [generatingContract, setGeneratingContract] = useState<number | null>(null);
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este contrato?")) {
      await deleteContract(id);
    }
  };

  const handleGenerateContract = async (contract: Contract) => {
    setGeneratingContract(contract.id);
    
    try {
      const webhookResponse = await fetch("https://n8n.sof.to/webhook-test/cc67ccb6-86d4-4ec6-ba76-35f42280112c", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        }),
      });

      toast({
        title: "Solicitação enviada",
        description: "A solicitação para gerar o contrato foi enviada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao chamar webhook:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação para gerar o contrato.",
        variant: "destructive",
      });
    } finally {
      setGeneratingContract(null);
    }
  };

  const handleCreateContract = async (contractData: Contract) => {
    try {
      // Chama o webhook do n8n
      const webhookResponse = await fetch("https://n8n.sof.to/webhook-test/44fbe481-ddef-4c19-ba63-59cc1c1e7413", {
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
          <Button onClick={() => setNewContractOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Nenhum contrato encontrado.</p>
            </div>
          ) : (
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
    </>
  );
}
