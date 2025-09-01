import React, { useMemo } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Payment } from "@/types/payment";
import { EditablePaymentRow } from "./EditablePaymentRow";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface EditablePaymentTableProps {
  payments?: Payment[];
  onRefresh?: () => void;
}

export const EditablePaymentTable = ({ 
  payments = [], 
  onRefresh
}: EditablePaymentTableProps) => {
  const { toast } = useToast();
  const [togglingServices, setTogglingServices] = useState<Set<string>>(new Set());

  const handlePaymentUpdated = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // Agrupar pagamentos por serviço (descrição base)
  const serviceGroups = useMemo(() => {
    const groups: { [key: string]: Payment[] } = {};
    
    payments.forEach(payment => {
      // Remover número de parcela da descrição para agrupar por serviço
      const baseDescription = payment.description?.replace(/\s*\(\d+\/\d+\).*$/, '') || payment.description;
      
      if (!groups[baseDescription]) {
        groups[baseDescription] = [];
      }
      groups[baseDescription].push(payment);
    });

    // Ordenar pagamentos dentro de cada grupo por data de vencimento
    Object.keys(groups).forEach(serviceName => {
      groups[serviceName].sort((a, b) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
    });

    return groups;
  }, [payments]);

  // Função para ativar/inativar serviço completo
  const toggleServiceStatus = async (serviceName: string, servicePayments: Payment[]) => {
    setTogglingServices(prev => new Set(prev).add(serviceName));
    
    try {
      // Determinar novo status: se algum estiver ativo, inativar todos; senão, ativar todos
      const hasActivePayments = servicePayments.some(p => p.status === 'pending');
      const newStatus = hasActivePayments ? 'cancelled' : 'pending';
      
      // Atualizar status de todos os pagamentos do serviço
      const { error } = await supabase
        .from('payments')
        .update({ status: newStatus })
        .in('id', servicePayments.map(p => p.id));

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Serviço "${serviceName}" ${newStatus === 'cancelled' ? 'inativado' : 'ativado'} com sucesso.`
      });
      
      handlePaymentUpdated();
    } catch (error) {
      console.error("Erro ao alterar status do serviço:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do serviço.",
        variant: "destructive"
      });
    } finally {
      setTogglingServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(serviceName);
        return newSet;
      });
    }
  };

  if (payments.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(serviceGroups).map(([serviceName, servicePayments]) => (
            <React.Fragment key={serviceName}>
              {/* Cabeçalho do serviço */}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={6} className="font-medium">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{serviceName}</span>
                      <Badge variant={servicePayments.some(p => p.status === 'pending') ? 'default' : 'secondary'}>
                        {servicePayments.some(p => p.status === 'pending') ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({servicePayments.length} parcela{servicePayments.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => toggleServiceStatus(serviceName, servicePayments)}
                    disabled={togglingServices.has(serviceName)}
                    variant={servicePayments.some(p => p.status === 'pending') ? 'destructive' : 'default'}
                  >
                    {togglingServices.has(serviceName) 
                      ? 'Alterando...' 
                      : servicePayments.some(p => p.status === 'pending')
                        ? 'Inativar'
                        : 'Ativar'
                    }
                  </Button>
                </TableCell>
              </TableRow>
              
              {/* Parcelas do serviço */}
              {servicePayments.map((payment) => (
                <EditablePaymentRow 
                  key={payment.id}
                  payment={payment} 
                  onPaymentUpdated={handlePaymentUpdated}
                />
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};