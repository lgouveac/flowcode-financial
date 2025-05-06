import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditEmployeeDialogProps {
  employee: {
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
  } | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditEmployeeDialog = ({
  employee,
  open,
  onClose,
  onSuccess,
}: EditEmployeeDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [position, setPosition] = useState("");
  const [pix, setPix] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [preferredTemplate, setPreferredTemplate] = useState<"invoice" | "hours" | "novo_subtipo">("invoice");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmail(employee.email);
      setPhone(employee.phone || "");
      setAddress(employee.address || "");
      setPosition(employee.position || "");
      setPix(employee.pix || "");
      setCnpj(employee.cnpj || "");
      setPaymentMethod(employee.payment_method || "");
      setPreferredTemplate(employee.preferred_template || "invoice");
    }
  }, [employee]);

  const handleSave = async () => {
    if (!employee) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("employees")
        .update({
          name,
          email,
          phone,
          address,
          position,
          pix,
          cnpj,
          payment_method: paymentMethod,
          preferred_template: preferredTemplate,
        })
        .eq("id", employee.id);

      if (error) {
        console.error("Error updating employee:", error);
        throw new Error("Failed to update employee");
      }

      toast({
        title: "Funcionário atualizado",
        description: "Os detalhes do funcionário foram atualizados com sucesso.",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description:
          error.message || "Ocorreu um erro ao atualizar o funcionário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Funcionário</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do funcionário aqui. Clique em salvar quando
            estiver pronto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Telefone
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Endereço
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              Cargo
            </Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pix" className="text-right">
              PIX
            </Label>
            <Input
              id="pix"
              value={pix}
              onChange={(e) => setPix(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cnpj" className="text-right">
              CNPJ
            </Label>
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentMethod" className="text-right">
              Método de Pagamento
            </Label>
            <Input
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="preferredTemplate" className="text-right">
              Template Preferido
            </Label>
            <Select onValueChange={value => setPreferredTemplate(value as "invoice" | "hours" | "novo_subtipo")}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um template" defaultValue={preferredTemplate} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Nota Fiscal</SelectItem>
                <SelectItem value="hours">Horas</SelectItem>
                <SelectItem value="novo_subtipo">Novo Subtipo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" onClick={handleSave} disabled={isLoading}>
          Salvar
        </Button>
      </DialogContent>
    </Dialog>
  );
};
