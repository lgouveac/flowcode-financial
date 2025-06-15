
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface TopClient {
  client_id: string;
  client_name: string;
  total_amount: number;
}

interface TopClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: TopClient[];
  loading: boolean;
  period: string;
  formatCurrency: (value: number) => string;
}

export const TopClientsDialog = ({ 
  open, 
  onOpenChange, 
  clients, 
  loading, 
  period, 
  formatCurrency 
}: TopClientsDialogProps) => {
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
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Top Clientes - {getPeriodLabel(period)}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="mt-4">
            {clients.length > 0 ? (
              <div className="space-y-4">
                {clients.map((client, index) => (
                  <div key={client.client_id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{index + 1}.</span>
                      <span className="font-medium">{client.client_name}</span>
                    </div>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(client.total_amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum cliente encontrado com pagamentos neste período.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
