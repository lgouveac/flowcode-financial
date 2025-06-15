
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfitAnalysisSectionProps {
  metrics: {
    totalRevenue?: number;
    operationalExpenses?: number;
    proLaboreExpenses?: number;
    investmentExpenses?: number;
    profitDistributionExpenses?: number;
    adjustedProfit?: number;
  };
  isLoading: boolean;
  formatCurrency: (value: number) => string;
}

export const ProfitAnalysisSection = ({ metrics, isLoading, formatCurrency }: ProfitAnalysisSectionProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Análise de Lucratividade</h2>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Alert variant="success" className="bg-green-50 dark:bg-green-950/20">
          <AlertTitle className="text-lg">Análise de Lucro Ajustado</AlertTitle>
          <AlertDescription>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <p className="font-medium">Receita Bruta:</p>
                <p>{formatCurrency(metrics.totalRevenue || 0)}</p>
                
                <p className="font-medium">Despesas Operacionais:</p>
                <p>- {formatCurrency(metrics.operationalExpenses || 0)}</p>
                
                <p className="font-medium">Pro Labore:</p>
                <p>- {formatCurrency(metrics.proLaboreExpenses || 0)}</p>
                
                <p className="font-medium">Investimento:</p>
                <p>- {formatCurrency(metrics.investmentExpenses || 0)}</p>
                
                <p className="font-medium">Lucros:</p>
                <p>- {formatCurrency(metrics.profitDistributionExpenses || 0)}</p>
                
                <div className="col-span-2 border-t border-green-200 dark:border-green-800 my-2"></div>
                
                <p className="font-medium text-lg">Lucro Ajustado:</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-500">
                  {formatCurrency(metrics.adjustedProfit || 0)}
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
