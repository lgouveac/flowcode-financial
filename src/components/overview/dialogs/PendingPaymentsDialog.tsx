
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentTable } from "@/components/payments/PaymentTable";
import type { Payment } from "@/types/payment";

interface PendingPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: Payment[];
  loading: boolean;
  period: string;
  onRefresh: () => void;
}

export const PendingPaymentsDialog = ({ 
  open, 
  onOpenChange, 
  payments, 
  loading, 
  period, 
  onRefresh 
}: PendingPaymentsDialogProps) => {
  const getPeriodLabel = (selectedPeriod: string) => {
    switch (selectedPeriod) {
      case "current": return "Mês Atual";
      case "last_month": return "Mês Anterior";
      case "last_3_months": return "Últimos 3 Meses";
      case "last_6_months": return "Últimos 6 Meses";
      case "last_year": return "Último Ano";
      default: return "Período Selecionado";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>Recebimentos Pendentes - {getPeriodLabel(period)}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <PaymentTable 
            payments={payments} 
            onRefresh={onRefresh}
            templates={[]}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
