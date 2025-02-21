
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEmployees } from "@/hooks/useEmployees";
import type { Employee } from "@/types/database";

type EmployeeFormData = Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'status'>;

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { createEmployee } = useEmployees();
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    cnpj: "",
    pix: "",
    address: "",
    full_name: "",
    email: "",
    phone: "",
    position: "",
    type: "fixed",
    payment_method: "pix",
    status: "active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmployee.mutateAsync(formData);
      toast({
        title: "Funcionário cadastrado",
        description: "O novo funcionário foi adicionado com sucesso.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar funcionário.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Novo Colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0001-00"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pix">Chave PIX</Label>
            <Input
              id="pix"
              placeholder="CPF, CNPJ, E-mail ou Celular"
              value={formData.pix}
              onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Input
              id="address"
              placeholder="Rua, número, complemento, bairro, cidade - UF"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Celular</Label>
            <Input
              id="phone"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "fixed" | "freelancer") =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Funcionário Fixo</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

