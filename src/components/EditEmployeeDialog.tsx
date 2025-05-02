import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MonthlyValuesList } from "./employees/MonthlyValuesList";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Employee {
  id: string;
  name: string;
  type: "fixed" | "freelancer";
  status: "active" | "inactive";
  payment_method: string;
  last_invoice?: string;
  cnpj?: string;
  pix?: string;
  address?: string;
  position?: string;
  phone?: string;
  email: string;
  preferred_template?: "invoice" | "hours" | "novo_subtipo";
}

interface EditEmployeeDialogProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditEmployeeDialog = ({ employee, open, onClose, onSuccess }: EditEmployeeDialogProps) => {
  const [formData, setFormData] = useState<Employee>({
    id: "",
    name: "",
    email: "",
    status: "active",
    type: "fixed",
    payment_method: "pix",
    preferred_template: "invoice",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        // Default preferred_template if not set
        preferred_template: employee.preferred_template || "invoice"
      });
    }
  }, [employee]);

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      const { error } = await supabase
        .from("employees")
        .update(data)
        .eq("id", employee?.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o funcionário.",
        variant: "destructive",
      });
      console.error("Error updating employee:", error);
    },
  });

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    updateEmployeeMutation.mutate({
      ...formData,
    });
  };

  const handleChange = (field: keyof Employee, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="min-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Funcionário</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type">Tipo</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
                className="flex flex-col space-y-1 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed">CLT / PJ Fixo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="freelancer" id="freelancer" />
                  <Label htmlFor="freelancer">Freelancer</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <RadioGroup
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
                className="flex flex-col space-y-1 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="active" />
                  <Label htmlFor="active">Ativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="inactive" />
                  <Label htmlFor="inactive">Inativo</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="payment_method">Método de Pagamento</Label>
              <Input
                id="payment_method"
                value={formData.payment_method || ""}
                onChange={(e) => handleChange("payment_method", e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position || ""}
                onChange={(e) => handleChange("position", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pix">PIX</Label>
              <Input
                id="pix"
                value={formData.pix || ""}
                onChange={(e) => handleChange("pix", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj || ""}
                onChange={(e) => handleChange("cnpj", e.target.value)}
              />
            </div>
          </div>

          {/* Add template preference selector */}
          <div>
            <Label htmlFor="preferred_template">Modelo de Email Preferencial</Label>
            <Select 
              value={formData.preferred_template || "invoice"}
              onValueChange={(value) => handleChange("preferred_template", value as "invoice" | "hours" | "novo_subtipo")}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Nota Fiscal</SelectItem>
                <SelectItem value="hours">Horas</SelectItem>
                <SelectItem value="novo_subtipo">Novo Subtipo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <h3 className="text-lg font-medium mb-4">Valores Mensais</h3>
            <MonthlyValuesList employeeId={employee?.id} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
