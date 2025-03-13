
import { useState, useEffect } from "react";
import { CashFlowChart } from "./cash-flow/CashFlowChart";
import { CashFlowTable } from "./cash-flow/CashFlowTable";
import { useCashFlow } from "@/hooks/useCashFlow";

interface CashFlowProps {
  showChart?: boolean;
  period?: string;
}

export const CashFlow = ({ showChart = true, period = 'current' }: CashFlowProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  
  // Use the selectedValues to create a custom period filter
  const [customPeriod, setCustomPeriod] = useState(period);
  
  // Update customPeriod when any filter changes
  useEffect(() => {
    if (selectedPeriod === 'month') {
      setCustomPeriod(`${selectedYear}-${selectedMonth}`);
    } else if (selectedPeriod === 'quarter') {
      setCustomPeriod(`quarter-${selectedYear}`);
    } else if (selectedPeriod === 'year') {
      setCustomPeriod(`year-${selectedYear}`);
    } else {
      // For predefined periods like 'current', 'last_month', etc.
      setCustomPeriod(selectedPeriod);
    }
  }, [selectedPeriod, selectedYear, selectedMonth]);
  
  // Use the custom period for fetching data
  const { cashFlow, onNewCashFlow, chartData } = useCashFlow(customPeriod);

  // Garantimos que cashFlow e chartData são sempre arrays, mesmo quando vazios
  const safeChartData = Array.isArray(chartData) ? chartData : [];
  const safeCashFlow = Array.isArray(cashFlow) ? cashFlow : [];

  // Log data for debugging
  useEffect(() => {
    console.log('CashFlow component period:', customPeriod);
    console.log('CashFlow component cashFlow data:', safeCashFlow);
    console.log('CashFlow component chartData:', safeChartData);
  }, [customPeriod, safeCashFlow, safeChartData]);

  return (
    <div className="space-y-8">
      {showChart ? (
        <>
          <CashFlowChart 
            chartData={safeChartData}
            period={selectedPeriod}
            setPeriod={setSelectedPeriod}
            year={selectedYear}
            setYear={setSelectedYear}
            month={selectedMonth}
            setMonth={setSelectedMonth}
          />
          <CashFlowTable 
            cashFlow={safeCashFlow}
            onNewCashFlow={onNewCashFlow}
          />
        </>
      ) : (
        <CashFlowTable 
          cashFlow={safeCashFlow}
          onNewCashFlow={onNewCashFlow}
        />
      )}
    </div>
  );
};
