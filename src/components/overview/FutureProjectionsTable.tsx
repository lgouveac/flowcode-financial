
interface FutureProjection {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface FutureProjectionsTableProps {
  data: FutureProjection[];
  formatCurrency: (value: number) => string;
}

export const FutureProjectionsTable = ({ data, formatCurrency }: FutureProjectionsTableProps) => {
  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-left font-medium">Mês</th>
              <th className="p-2 text-right font-medium">Receita</th>
              <th className="p-2 text-right font-medium">Despesas</th>
              <th className="p-2 text-right font-medium">Lucro</th>
            </tr>
          </thead>
          <tbody>
            {data.map((projection) => (
              <tr key={projection.month} className="border-b">
                <td className="p-2 font-medium">{projection.month}</td>
                <td className="p-2 text-right text-green-600 dark:text-green-400">
                  {formatCurrency(projection.revenue)}
                </td>
                <td className="p-2 text-right text-red-600 dark:text-red-400">
                  {formatCurrency(projection.expenses)}
                </td>
                <td className="p-2 text-right font-semibold">
                  {formatCurrency(projection.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
