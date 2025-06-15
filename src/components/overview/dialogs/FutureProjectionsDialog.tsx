
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FutureProjectionsChart } from "../FutureProjectionsChart";
import { FutureProjectionsTable } from "../FutureProjectionsTable";

interface FutureProjection {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface FutureProjectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projections: FutureProjection[];
  loading: boolean;
  formatCurrency: (value: number) => string;
}

export const FutureProjectionsDialog = ({ 
  open, 
  onOpenChange, 
  projections, 
  loading, 
  formatCurrency 
}: FutureProjectionsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Projeções Financeiras - Próximos 12 Meses</DialogTitle>
          <DialogDescription>
            Previsão de receitas, despesas e lucros para os próximos 12 meses.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            <FutureProjectionsChart data={projections} formatCurrency={formatCurrency} />
            <FutureProjectionsTable data={projections} formatCurrency={formatCurrency} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
