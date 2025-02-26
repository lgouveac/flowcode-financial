
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useEmployeeMonthlyValues } from "@/hooks/useEmployeeMonthlyValues";
import { NewMonthlyValueDialog } from "./NewMonthlyValueDialog";
import { useState } from "react";
import { EditMonthlyValueDialog } from "./EditMonthlyValueDialog";
import { EmployeeMonthlyValue } from "@/types/employee";

interface MonthlyValuesListProps {
  employeeId: string;
}

export const MonthlyValuesList = ({ employeeId }: MonthlyValuesListProps) => {
  const { monthlyValues, isLoading } = useEmployeeMonthlyValues(employeeId);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<EmployeeMonthlyValue | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valores Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando valores mensais...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Valores Mensais</CardTitle>
          <Button onClick={() => setIsNewDialogOpen(true)} variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Valor
          </Button>
        </CardHeader>
        <CardContent>
          {monthlyValues.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum valor mensal cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyValues.map((value) => (
                  <TableRow
                    key={value.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setEditingValue(value)}
                  >
                    <TableCell>
                      {new Date(value.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value.amount)}
                    </TableCell>
                    <TableCell>{value.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewMonthlyValueDialog
        open={isNewDialogOpen}
        onClose={() => setIsNewDialogOpen(false)}
        employeeId={employeeId}
      />

      {editingValue && (
        <EditMonthlyValueDialog
          monthlyValue={editingValue}
          open={true}
          onClose={() => setEditingValue(null)}
        />
      )}
    </>
  );
};
