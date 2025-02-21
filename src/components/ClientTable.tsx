import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, MailIcon, PhoneIcon } from "lucide-react";
import { useState } from "react";
import { EditableCell } from "./EditableCell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useClients } from "@/hooks/useClients";
import type { Client } from "@/types/database";

interface NewClientFormProps {
  onSubmit: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

const NewClientForm = ({ onSubmit, onClose }: NewClientFormProps) => {
  const [clientType, setClientType] = useState<"pf" | "pj">("pj");
  const [formData, setFormData] = useState<Partial<Client>>({
    email: "",
    type: "pj",
    company_name: "",
    cnpj: "",
    partner_name: "",
    partner_cpf: "",
    address: "",
    due_date: "",
    payment_method: "pix",
    status: "active",
    total_billing: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Omit<Client, 'id' | 'created_at' | 'updated_at'>);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full"
          />
        </div>

        <div className="grid gap-2">
          <Label>Você contratará como pessoa física ou jurídica?</Label>
          <RadioGroup
            value={clientType}
            onValueChange={(value: "pf" | "pj") => {
              setClientType(value);
              setFormData({ ...formData, type: value });
            }}
            className="grid sm:grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pf" id="pf" />
              <Label htmlFor="pf">PF</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pj" id="pj" />
              <Label htmlFor="pj">PJ</Label>
            </div>
          </RadioGroup>
        </div>

        {clientType === "pj" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Razão Social da Empresa</Label>
              <Input
                id="companyName"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cnpj">Qual seu CNPJ?</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="partnerName">Nome completo do sócio</Label>
              <Input
                id="partnerName"
                value={formData.partner_name}
                onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="partnerCpf">CPF do sócio</Label>
              <Input
                id="partnerCpf"
                value={formData.partner_cpf}
                onChange={(e) => setFormData({ ...formData, partner_cpf: e.target.value })}
                required
                placeholder="000.000.000-00"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Qual seu nome completo?</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                required
                placeholder="000.000.000-00"
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="address">Endereço completo com CEP</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dueDate">
              {clientType === "pj" 
                ? "Melhor data de vencimento do pagamento ou data da primeira parcela"
                : "Melhor data de vencimento do pagamento"
              }
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Qual a melhor maneira de pagamento?</Label>
          <RadioGroup
            value={formData.payment_method}
            onValueChange={(value: "pix" | "boleto" | "credit_card") => 
              setFormData({ ...formData, payment_method: value })
            }
            className="grid sm:grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pix" id="payment-pix" />
              <Label htmlFor="payment-pix">PIX</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="boleto" id="payment-boleto" />
              <Label htmlFor="payment-boleto">Boleto</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="credit_card" id="payment-credit-card" />
              <Label htmlFor="payment-credit-card">Cartão de crédito</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar
        </Button>
      </div>
    </form>
  );
};

export const ClientTable = () => {
  const { clients, isLoading, error, createClient, updateClient } = useClients();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleChange = async (id: string, field: keyof Client, value: string | number) => {
    try {
      await updateClient.mutateAsync({ id, [field]: value });
      toast({
        title: "Cliente atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleNewClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createClient.mutateAsync(clientData);
      setDialogOpen(false);
      toast({
        title: "Cliente adicionado",
        description: "O novo cliente foi cadastrado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o cliente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar os clientes. Por favor, tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto gap-2">
              <PlusIcon className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            <NewClientForm
              onSubmit={handleNewClient}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-lg border bg-card">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:!pr-0">Nome</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Contato</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">Faturamento Total</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden lg:table-cell">Último Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4">
                    <EditableCell
                      value={client.name}
                      onChange={(value) => handleChange(client.id, 'name', value)}
                    />
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center">
                        <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <EditableCell
                          value={client.email}
                          onChange={(value) => handleChange(client.id, 'email', value)}
                          type="email"
                        />
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <EditableCell
                          value={client.phone}
                          onChange={(value) => handleChange(client.id, 'phone', value)}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      client.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : client.status === "overdue"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {client.status === "active" ? "Ativo" 
                        : client.status === "overdue" ? "Inadimplente" 
                        : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <EditableCell
                      value={client.total_billing.toFixed(2)}
                      onChange={(value) => handleChange(client.id, 'total_billing', parseFloat(value) || 0)}
                      type="number"
                    />
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <EditableCell
                      value={client.last_payment || ""}
                      onChange={(value) => handleChange(client.id, 'last_payment', value)}
                      type="date"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
