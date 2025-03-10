
import { useState } from "react";
import { CashFlowChart } from "./cash-flow/CashFlowChart";
import { CashFlowTable } from "./cash-flow/CashFlowTable";
import { useCashFlow } from "@/hooks/useCashFlow";

interface CashFlowProps {
  showChart?: boolean;
  period?: string;
}

export const CashFlow = ({ showChart = true, period = 'current' }: CashFlowProps) => {
  const { cashFlow, onNewCashFlow, chartData } = useCashFlow(period);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());

  return (
    <div className="space-y-8">
      {showChart ? (
        <>
          <CashFlowChart 
            chartData={chartData}
            period={selectedPeriod}
            setPeriod={setSelectedPeriod}
            year={selectedYear}
            setYear={setSelectedYear}
            month={selectedMonth}
            setMonth={setSelectedMonth}
          />
          <CashFlowTable 
            cashFlow={cashFlow}
            onNewCashFlow={onNewCashFlow}
          />
        </>
      ) : (
        <CashFlowTable 
          cashFlow={cashFlow}
          onNewCashFlow={onNewCashFlow}
        />
      )}
    </div>
  );
};
