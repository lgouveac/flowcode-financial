
import { useState, useEffect } from "react";
import { CashFlowChart } from "./cash-flow/CashFlowChart";
import { CashFlowTable } from "./cash-flow/CashFlowTable";
import { useCashFlow } from "@/hooks/useCashFlow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, DollarSignIcon } from "lucide-react";

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

  // Calculate summary totals with precise decimal handling
  const summary = safeCashFlow.reduce((acc, flow) => {
    // Convert to string first, then parse to handle any format issues
    const rawAmount = String(flow.amount).replace(',', '.');
    const amount = parseFloat(rawAmount);
    
    // Skip NaN values
    if (!isNaN(amount)) {
      if (flow.type === 'income') {
        // Use toFixed(2) to limit to 2 decimal places and parseFloat to convert back to number
        acc.income = parseFloat((acc.income + amount).toFixed(2));
      } else {
        acc.expense = parseFloat((acc.expense + amount).toFixed(2));
      }
    }
    return acc;
  }, { income: 0, expense: 0 });

  // Log the details for debugging with more precision
  console.log('Summary calculation details:', { 
    expense: summary.expense.toFixed(2),
    income: summary.income.toFixed(2),
    total: safeCashFlow.length,
    expenseItems: safeCashFlow
      .filter(flow => flow.type === 'expense')
      .map(flow => ({
        description: flow.description,
        amount: flow.amount,
        amountType: typeof flow.amount,
        parsedAmount: parseFloat(String(flow.amount).replace(',', '.')),
        type: flow.type
      }))
  });

  const balance = parseFloat((summary.income - summary.expense).toFixed(2));

  // Format currency with consistent decimal places
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Log data for debugging
  useEffect(() => {
    console.log('CashFlow component period:', customPeriod);
    console.log('CashFlow component cashFlow data length:', safeCashFlow.length);
    console.log('CashFlow component summary:', summary);
  }, [customPeriod, safeCashFlow, summary]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entradas
            </CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(summary.income)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saídas
            </CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(summary.expense)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo
            </CardTitle>
            <DollarSignIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

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
