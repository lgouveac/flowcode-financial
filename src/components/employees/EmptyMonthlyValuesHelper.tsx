
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  status: string;
  monthly_values?: { id: string; due_date: string; due_data: number }[];
}

export const EmptyMonthlyValuesHelper = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  
  const checkEmployeeValues = async () => {
    try {
      setIsLoading(true);
      
      // Get current month in YYYY-MM-01 format
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const currentMonth = `${year}-${month}-01`;
      
      // Fetch active employees
      const { data: activeEmployees, error: employeesError } = await supabase
        .from("employees")
        .select("id, name, email, status")
        .eq("status", "active")
        .order("name");
        
      if (employeesError) throw employeesError;
      
      // For each employee, check if they have monthly values for current month
      const employeesWithValueData: EmployeeRecord[] = [];
      
      for (const employee of activeEmployees || []) {
        const { data: monthlyValues, error: valuesError } = await supabase
          .from("employee_monthly_values")
          .select("id, due_date, due_data")
          .eq("employee_id", employee.id)
          .eq("due_date", currentMonth);
          
        if (valuesError) throw valuesError;
        
        employeesWithValueData.push({
          ...employee,
          monthly_values: monthlyValues || []
        });
      }
      
      setEmployees(employeesWithValueData);
      setHasChecked(true);
      
      toast({
        title: "Verificação concluída",
        description: "Verificação de valores mensais concluída com sucesso.",
      });
    } catch (error: any) {
      console.error("Error checking employee values:", error);
      toast({
        title: "Erro na verificação",
        description: error.message || "Não foi possível verificar os valores mensais.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const addMissingValue = async (employeeId: string, name: string) => {
    try {
      setIsLoading(true);
      
      // Create a value for the current month
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const currentMonth = `${year}-${month}-01`;
      
      const { data, error } = await supabase
        .from("employee_monthly_values")
        .insert({
          employee_id: employeeId,
          due_date: currentMonth,
          due_data: 1000, // Default example value
          notes: "Valor automático para teste"
        })
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Valor adicionado",
        description: `Valor mensal para ${name} adicionado com sucesso.`,
      });
      
      // Refresh the data
      checkEmployeeValues();
    } catch (error: any) {
      console.error("Error adding monthly value:", error);
      toast({
        title: "Erro ao adicionar valor",
        description: error.message || "Não foi possível adicionar o valor mensal.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Diagnóstico de Notificações</h3>
        <Button 
          onClick={checkEmployeeValues} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar Valores Mensais"
          )}
        </Button>
      </div>
      
      {hasChecked && (
        <Alert variant="default" className="bg-muted/50">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Mês Atual: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</AlertTitle>
          <AlertDescription>
            Para enviar notificações, os funcionários precisam ter valores mensais cadastrados para o mês atual no formato YYYY-MM-01.
          </AlertDescription>
        </Alert>
      )}
      
      {hasChecked && employees.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Funcionário
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Valor Mensal
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-muted-foreground text-xs">{employee.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {employee.monthly_values && employee.monthly_values.length > 0 ? (
                      <div className="text-green-600">
                        Valor cadastrado: {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }).format(employee.monthly_values[0].due_data)}
                      </div>
                    ) : (
                      <span className="text-red-500">Sem valor para o mês atual</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {employee.monthly_values && employee.monthly_values.length === 0 && (
                      <Button
                        onClick={() => addMissingValue(employee.id, employee.name)}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                      >
                        Adicionar Valor
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
