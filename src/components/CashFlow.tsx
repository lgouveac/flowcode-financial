
import { CashFlowChart } from "./cash-flow/CashFlowChart";
import { CashFlowTable } from "./cash-flow/CashFlowTable";
import { useCashFlow } from "@/hooks/useCashFlow";

interface CashFlowProps {
  showChart?: boolean;
  period?: string;
}

export const CashFlow = ({ showChart = true, period = 'current' }: CashFlowProps) => {
  const { cashFlow, onNewCashFlow, chartData } = useCashFlow(period);

  return (
    <div className="space-y-8">
      {showChart ? (
        <CashFlowChart chartData={chartData} />
      ) : (
        <CashFlowTable 
          cashFlow={cashFlow}
          onNewCashFlow={onNewCashFlow}
        />
      )}
    </div>
  );
};
