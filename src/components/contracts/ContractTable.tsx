
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditIcon, TrashIcon, PlusIcon } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { formatCurrency } from "@/components/payments/utils/formatUtils";
import { formatDate } from "@/utils/formatters";
import { Contract } from "@/types/contract";
import { NewContractDialog } from "./NewContractDialog";
import { EditContractDialog } from "./EditContractDialog";

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

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este contrato?")) {
      await deleteContract(id);
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
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.clients?.name || "Cliente não encontrado"}
                      </TableCell>
                      <TableCell>{contract.scope || "-"}</TableCell>
                      <TableCell>
                        {contract.total_value ? formatCurrency(contract.total_value) : "-"}
                      </TableCell>
                      <TableCell>{contract.installments || "-"}</TableCell>
                      <TableCell>
                        {contract.start_date ? formatDate(new Date(contract.start_date), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contract.status)}>
                          {getStatusLabel(contract.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingContract(contract)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contract.id)}
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
