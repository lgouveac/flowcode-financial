
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface EmployeeFormData {
  cnpj: string;
  pix: string;
  address: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  type: "fixed" | "freelancer";
}

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EmployeeFormData>({
    cnpj: "",
    pix: "",
    address: "",
    fullName: "",
    email: "",
    phone: "",
    position: "",
    type: "fixed",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Submitting employee data:", formData);
      
      const { data: employee, error } = await supabase
        .from("employees")
        .insert([
          {
            name: formData.fullName,
            email: formData.email,
            type: formData.type,
            cnpj: formData.cnpj,
            pix: formData.pix,
            address: formData.address,
            position: formData.position,
            phone: formData.phone,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating employee:", error);
        throw error;
      }

      console.log("Employee created successfully:", employee);
      
      toast({
        title: "Funcionário cadastrado",
        description: "O novo funcionário foi adicionado com sucesso.",
      });
      
      // Invalidate employees query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      
      setOpen(false);
      
      // Reset form
      setFormData({
        cnpj: "",
        pix: "",
        address: "",
        fullName: "",
        email: "",
        phone: "",
        position: "",
        type: "fixed",
      });
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erro ao cadastrar funcionário",
        description: error.message || "Ocorreu um erro ao adicionar o funcionário.",
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
      <DialogContent className="sm:max-w-[500px] bg-card">
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
              required
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
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Funcionário Fixo</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
