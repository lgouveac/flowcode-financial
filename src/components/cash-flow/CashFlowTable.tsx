
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { PlusIcon, CheckCircle, XCircle } from "lucide-react";
import type { CashFlow as CashFlowType } from "@/types/cashflow";
import { NewCashFlowForm } from "./NewCashFlowForm";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface CashFlowTableProps {
  cashFlow: CashFlowType[];
  onNewCashFlow: () => void;
}

export const CashFlowTable = ({ cashFlow, onNewCashFlow }: CashFlowTableProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('cash_flow')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Movimentação ${newStatus === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status da movimentação.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: CashFlowType['status']) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-6">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-2xl font-display">Movimentações</CardTitle>
          <p className="text-sm text-muted-foreground">Acompanhe suas últimas movimentações</p>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-end mb-6">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary-hover">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <NewCashFlowForm 
              onSuccess={onNewCashFlow}
              onClose={() => setOpenDialog(false)}
            />
          </Dialog>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Data</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Descrição</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Valor</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cashFlow.map((flow) => (
                <tr key={flow.id} className="hover:bg-muted/50">
                  <td className="py-3 px-4">
                    {new Date(flow.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4">{flow.description}</td>
                  <td className={`py-3 px-4 ${flow.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(flow.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      flow.type === 'income' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {flow.type === 'income' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(flow.status)}
                  </td>
                  <td className="py-3 px-4">
                    {flow.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(flow.id, 'approved')}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(flow.id, 'rejected')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

