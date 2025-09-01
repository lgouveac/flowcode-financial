
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { useEmployeeMonthlyValues } from "@/hooks/useEmployeeMonthlyValues";
import { NewMonthlyValueDialog } from "./NewMonthlyValueDialog";
import { useState } from "react";
import { EditMonthlyValueDialog } from "./EditMonthlyValueDialog";
import { EmployeeMonthlyValue } from "@/types/employee";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface MonthlyValuesListProps {
  employeeId: string;
}

export const MonthlyValuesList = ({
  employeeId
}: MonthlyValuesListProps) => {
  const {
    monthlyValues,
    isLoading,
    deleteMonthlyValue
  } = useEmployeeMonthlyValues(employeeId);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<EmployeeMonthlyValue | null>(null);
  const [deletingValue, setDeletingValue] = useState<EmployeeMonthlyValue | null>(null);

  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Valores Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando valores mensais...</p>
          </div>
        </CardContent>
      </Card>;
  }

  return <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Valores Mensais</CardTitle>
          <Button onClick={() => setIsNewDialogOpen(true)} variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Valor
          </Button>
        </CardHeader>
        <CardContent>
          {monthlyValues.length === 0 ? <div className="text-center py-4 text-muted-foreground">
              Nenhum valor mensal cadastrado
            </div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyValues.map(value => <TableRow key={value.id} className="hover:bg-muted/50">
                    <TableCell>
                      {new Date(value.due_date).toLocaleDateString('pt-BR', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(value.due_data)}
                    </TableCell>
                    <TableCell>{value.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingValue(value)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Valor Mensal</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este valor mensal? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMonthlyValue(value.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>

      <NewMonthlyValueDialog open={isNewDialogOpen} onClose={() => setIsNewDialogOpen(false)} employeeId={employeeId} />

      {editingValue && <EditMonthlyValueDialog monthlyValue={editingValue} open={true} onClose={() => setEditingValue(null)} />}
    </>;
};
