
import { useState } from "react";
import { useCashFlow } from "@/hooks/useCashFlow";
import { CashFlowChart } from "./cash-flow/CashFlowChart";
import { CashFlowTable } from "./cash-flow/CashFlowTable";

interface CashFlowProps {
  showChart?: boolean;
}

export const CashFlow = ({
  showChart = true
}: CashFlowProps) => {
  const [period, setPeriod] = useState('month');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const { cashFlow, chartData, fetchCashFlow } = useCashFlow();

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col space-y-8">
        {showChart && chartData.length > 0 ? (
          <CashFlowChart
            chartData={chartData}
            period={period}
            setPeriod={setPeriod}
            year={year}
            setYear={setYear}
            month={month}
            setMonth={setMonth}
          />
        ) : showChart && (
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              O gráfico será exibido quando houver movimentações registradas
            </p>
          </div>
        )}
        <CashFlowTable 
          cashFlow={cashFlow}
          onNewCashFlow={fetchCashFlow}
        />
      </div>
    </div>
  );
};
