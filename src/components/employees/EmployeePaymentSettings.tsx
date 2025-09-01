import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, EditIcon, SaveIcon, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Employee } from "@/types/employee";
import { EmployeeMonthlyValue } from "@/types/employee";
import { formatDate } from "@/utils/formatters";
import { formatCurrency } from "@/components/payments/utils/formatUtils";

export function EmployeePaymentSettings() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [paymentDay, setPaymentDay] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [templateType, setTemplateType] = useState<"invoice" | "hours" | "novo_subtipo">("invoice");
  const [monthlyValues, setMonthlyValues] = useState<Record<string, EmployeeMonthlyValue>>({});

  // Memoize the fetch function to prevent infinite re-renders
  const fetchEmployeesAndValues = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Fetching active employees...");
      
      // Fetch active employees
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (employeeError) throw employeeError;

      // Ensure proper typing by mapping the data
      const typedEmployees = employeeData?.map(emp => ({
        ...emp,
        type: emp.type as "fixed" | "freelancer",
        status: emp.status as "active" | "inactive",
        preferred_template: emp.preferred_template as "invoice" | "hours" | "novo_subtipo" || "invoice"
      })) || [];

      console.log(`Found ${typedEmployees.length} active employees`);
      setEmployees(typedEmployees);
      
      // Fetch monthly values for all employees in a single optimized query
      if (typedEmployees.length > 0) {
        console.log("Fetching monthly values for all employees...");
        
        const employeeIds = typedEmployees.map(emp => emp.id);
        
        const { data: allMonthlyValues, error: valuesError } = await supabase
          .from("employee_monthly_values")
          .select("*")
          .in("employee_id", employeeIds)
          .order("due_date", { ascending: false });

        if (valuesError) {
          console.error("Error fetching monthly values:", valuesError);
          throw valuesError;
        }

        // Group monthly values by employee_id and get the latest one for each
        const valuesByEmployee: Record<string, EmployeeMonthlyValue> = {};
        
        if (allMonthlyValues) {
          console.log(`Found ${allMonthlyValues.length} total monthly values`);
          
          // Group by employee_id and keep only the latest (first due to desc order)
          allMonthlyValues.forEach(value => {
            if (!valuesByEmployee[value.employee_id]) {
              valuesByEmployee[value.employee_id] = value as EmployeeMonthlyValue;
            }
          });
          
          console.log(`Processed monthly values for ${Object.keys(valuesByEmployee).length} employees`);
        }
        
        setMonthlyValues(valuesByEmployee);
      }
    } catch (error: any) {
      console.error("Error fetching employees and values:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message || "Não foi possível carregar os funcionários e valores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []); // Remove toast from dependencies to prevent infinite loop

  // Fetch data only once when component mounts
  useEffect(() => {
    fetchEmployeesAndValues();
  }, [fetchEmployeesAndValues]);

  // Start editing an employee's payment settings
  const handleEdit = (employee: Employee) => {
    console.log(`Starting edit for employee: ${employee.name} (${employee.id})`);
    setEditingEmployee(employee.id);
    
    // Set current values if available
    const currentMonthlyValue = monthlyValues[employee.id];
    if (currentMonthlyValue) {
      console.log(`Found existing monthly value for ${employee.name}:`, currentMonthlyValue);
      setPaymentDay(currentMonthlyValue.due_date);
      setPaymentAmount(currentMonthlyValue.due_data.toString());
    } else {
      console.log(`No existing monthly value found for ${employee.name}, using defaults`);
      // Get the current date as default
      const today = new Date();
      const formattedDate = formatDate(today, "yyyy-MM-dd");
      setPaymentDay(formattedDate);
      setPaymentAmount("0");
    }
    
    setTemplateType(employee.preferred_template || "invoice");
  };

  // Delete the payment settings
  const handleDelete = async (employee: Employee) => {
    try {
      console.log(`Deleting payment settings for employee: ${employee.name}`);
      
      const existingValue = monthlyValues[employee.id];
      
      if (existingValue) {
        console.log(`Deleting monthly value with ID: ${existingValue.id}`);
        
        // Delete the monthly value record
        const { data: deletedData, error: deleteError } = await supabase
          .from("employee_monthly_values")
          .delete()
          .eq("id", existingValue.id)
          .select();

        console.log("Delete result:", { deletedData, deleteError });

        if (deleteError) throw deleteError;

        console.log(`Resetting template for employee: ${employee.id}`);
        
        // Reset employee preferred template to default
        const { error: templateError } = await supabase
          .from("employees")
          .update({ preferred_template: "invoice" })
          .eq("id", employee.id);

        console.log("Template update result:", { templateError });

        if (templateError) throw templateError;

        toast({
          title: "Configuração de pagamento excluída",
          description: `A configuração de pagamento para ${employee.name} foi removida com sucesso.`,
        });

        // Refresh all data from database to ensure consistency
        await fetchEmployeesAndValues();
      } else {
        toast({
          title: "Nenhuma configuração encontrada",
          description: `${employee.name} não possui configuração de pagamento para excluir.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error deleting payment settings:", error);
      toast({
        title: "Erro ao excluir configuração",
        description: error.message || "Não foi possível excluir a configuração de pagamento.",
        variant: "destructive",
      });
    }
  };

  // Save the payment settings
  const handleSave = async (employee: Employee) => {
    try {
      console.log(`Saving payment settings for employee: ${employee.name}`);
      
      // Update employee preferred template
      const { error: templateError } = await supabase
        .from("employees")
        .update({ preferred_template: templateType })
        .eq("id", employee.id);

      if (templateError) throw templateError;

      // Check if a monthly value already exists for this employee
      const existingValue = monthlyValues[employee.id];

      if (existingValue) {
        console.log(`Updating existing monthly value for ${employee.name}`);
        // Update existing monthly value
        const { error: updateError } = await supabase
          .from("employee_monthly_values")
          .update({ 
            due_date: paymentDay,
            due_data: parseFloat(paymentAmount) 
          })
          .eq("id", existingValue.id);

        if (updateError) throw updateError;
      } else {
        console.log(`Creating new monthly value for ${employee.name}`);
        // Create new monthly value
        const { error: insertError } = await supabase
          .from("employee_monthly_values")
          .insert({
            employee_id: employee.id,
            due_date: paymentDay,
            due_data: parseFloat(paymentAmount),
            notes: "Valor configurado na página de pagamentos"
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Configurações de pagamento salvas",
        description: `As configurações de pagamento para ${employee.name} foram atualizadas com sucesso.`,
      });

      // Refresh data
      const updatedEmployees = employees.map(emp => 
        emp.id === employee.id 
          ? { ...emp, preferred_template: templateType }
          : emp
      );
      setEmployees(updatedEmployees);
      
      // Update monthly values state
      const updatedMonthlyValues = {
        ...monthlyValues,
        [employee.id]: {
          ...existingValue,
          employee_id: employee.id,
          due_date: paymentDay,
          due_data: parseFloat(paymentAmount),
          id: existingValue?.id || 'temp-id',
          notes: existingValue?.notes || "Valor configurado na página de pagamentos"
        }
      };
      setMonthlyValues(updatedMonthlyValues);

      // Reset editing state
      setEditingEmployee(null);
    } catch (error: any) {
      console.error("Error saving payment settings:", error);
      toast({
        title: "Erro ao salvar configurações",
        description: error.message || "Não foi possível salvar as configurações de pagamento.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Carregando funcionários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Nenhum funcionário ativo encontrado.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Dia do Pagamento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Template</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                
                {editingEmployee === employee.id ? (
                  <>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={paymentDay}
                          onChange={(e) => setPaymentDay(e.target.value)}
                          className="w-40"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={templateType} onValueChange={(value) => setTemplateType(value as "invoice" | "hours" | "novo_subtipo")}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="invoice">Nota Fiscal</SelectItem>
                          <SelectItem value="hours">Horas</SelectItem>
                          <SelectItem value="novo_subtipo">Novo Subtipo</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSave(employee)}
                        className="flex items-center gap-1"
                      >
                        <SaveIcon className="h-4 w-4" />
                        Salvar
                      </Button>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>
                      {renderEmployeePaymentDay(employee, monthlyValues[employee.id])}
                    </TableCell>
                    <TableCell>
                      {renderEmployeePaymentAmount(monthlyValues[employee.id])}
                    </TableCell>
                    <TableCell>
                      {renderTemplateType(employee.preferred_template)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(employee)}
                          className="flex items-center gap-1"
                        >
                          <EditIcon className="h-4 w-4" />
                          Editar
                        </Button>
                        
                        {monthlyValues[employee.id] && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 flex items-center gap-1"
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Configuração de Pagamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a configuração de pagamento para <strong>{employee.name}</strong>? 
                                  Isso removerá o valor mensal configurado e resetará o template para "Nota Fiscal". Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(employee)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir Configuração
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Helper function to render payment day from monthly values
function renderEmployeePaymentDay(employee: Employee, monthlyValue?: EmployeeMonthlyValue) {
  if (!monthlyValue) return <span className="text-muted-foreground">A definir</span>;
  
  try {
    const date = new Date(monthlyValue.due_date);
    return formatDate(date, "dd/MM/yyyy");
  } catch (e) {
    return <span className="text-muted-foreground">Data inválida</span>;
  }
}

// Helper function to render payment amount from monthly values
function renderEmployeePaymentAmount(monthlyValue?: EmployeeMonthlyValue) {
  if (!monthlyValue) return <span className="text-muted-foreground">A definir</span>;
  return formatCurrency(monthlyValue.due_data);
}

// Helper function to render template type
function renderTemplateType(type?: string) {
  if (!type) return <span className="text-muted-foreground">Nota Fiscal (padrão)</span>;
  
  switch (type) {
    case "invoice":
      return "Nota Fiscal";
    case "hours":
      return "Horas";
    case "novo_subtipo":
      return "Novo Subtipo";
    default:
      return <span className="text-muted-foreground">Desconhecido</span>;
  }
}
