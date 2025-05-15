
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, EditIcon, SaveIcon } from "lucide-react";
import { Employee } from "@/types/employee";
import { cn } from "@/lib/utils";
import { EmployeeMonthlyValue } from "@/types/employee";

export function EmployeePaymentSettings() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [paymentDay, setPaymentDay] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [templateType, setTemplateType] = useState<"invoice" | "hours" | "novo_subtipo">("invoice");

  // Fetch active employees
  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("status", "active")
          .order("name");

        if (error) throw error;

        setEmployees(data || []);
      } catch (error: any) {
        console.error("Error fetching employees:", error);
        toast({
          title: "Erro ao carregar funcionários",
          description: error.message || "Não foi possível carregar os funcionários.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchEmployees();
  }, [toast]);

  // Start editing an employee's payment settings
  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee.id);
    // Get the current day of month
    const today = new Date();
    const dayOfMonth = today.getDate().toString().padStart(2, '0');
    setPaymentDay(dayOfMonth);
    setPaymentAmount(employee.id ? "0" : ""); // Default to 0
    setTemplateType(employee.preferred_template || "invoice");
  };

  // Save the payment settings
  const handleSave = async (employee: Employee) => {
    try {
      // Update employee preferred template
      const { error: templateError } = await supabase
        .from("employees")
        .update({ preferred_template: templateType })
        .eq("id", employee.id);

      if (templateError) throw templateError;

      // Format the date as YYYY-MM-DD for the current month
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${paymentDay.padStart(2, '0')}`;

      // Check if a monthly value already exists for this month
      const { data: existingValues, error: checkError } = await supabase
        .from("employee_monthly_values")
        .select("*")
        .eq("employee_id", employee.id)
        .like("due_date", `${year}-${month}-%`);

      if (checkError) throw checkError;

      if (existingValues && existingValues.length > 0) {
        // Update existing monthly value
        const { error: updateError } = await supabase
          .from("employee_monthly_values")
          .update({ 
            due_date: formattedDate,
            due_data: parseFloat(paymentAmount) 
          })
          .eq("id", existingValues[0].id);

        if (updateError) throw updateError;
      } else {
        // Create new monthly value
        const { error: insertError } = await supabase
          .from("employee_monthly_values")
          .insert({
            employee_id: employee.id,
            due_date: formattedDate,
            due_data: parseFloat(paymentAmount),
            notes: "Valor configurado na página de pagamentos"
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Configurações de pagamento salvas",
        description: `As configurações de pagamento para ${employee.name} foram atualizadas com sucesso.`,
      });

      // Refresh employees list
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setEmployees(data || []);

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
                          type="number"
                          min="1"
                          max="31"
                          value={paymentDay}
                          onChange={(e) => setPaymentDay(e.target.value)}
                          className="w-20"
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
                      {renderEmployeePaymentDay(employee)}
                    </TableCell>
                    <TableCell>
                      {renderEmployeePaymentAmount(employee)}
                    </TableCell>
                    <TableCell>
                      {renderTemplateType(employee.preferred_template)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(employee)}
                        className="flex items-center gap-1"
                      >
                        <EditIcon className="h-4 w-4" />
                        Editar
                      </Button>
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
function renderEmployeePaymentDay(employee: Employee) {
  return <span className="text-muted-foreground">A definir</span>;
}

// Helper function to render payment amount from monthly values
function renderEmployeePaymentAmount(employee: Employee) {
  return <span className="text-muted-foreground">A definir</span>;
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
