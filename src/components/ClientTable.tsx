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

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "overdue";
  totalBilling: number;
  lastPayment?: string;
  type: "pf" | "pj";
  // Campos PJ
  companyName?: string;
  cnpj?: string;
  partnerName?: string;
  partnerCpf?: string;
  // Campos PF
  cpf?: string;
  // Campos comuns
  address: string;
  dueDate: string;
  paymentMethod: "pix" | "boleto" | "credit_card";
}

const mockClients: Client[] = [
  {
    id: "1",
    name: "Tech Solutions Ltda",
    email: "contato@techsolutions.com",
    phone: "(11) 99999-9999",
    status: "active",
    totalBilling: 15000.00,
    lastPayment: "10/03/2024",
    cnpj: "12.345.678/0001-90",
    companyName: "Tech Solutions Ltda",
    partnerName: "João Silva",
    partnerCpf: "123.456.789-00",
    address: "Rua A, 123, Centro, São Paulo - SP",
    dueDate: "2024-04-10",
    paymentMethod: "pix",
    type: "pj",
  },
  {
    id: "2",
    name: "Digital Marketing Co",
    email: "financeiro@digitalmarket.com",
    phone: "(11) 98888-8888",
    status: "overdue",
    totalBilling: 8500.00,
    lastPayment: "05/02/2024",
    cpf: "987.654.321-10",
    address: "Rua B, 456, Vila, Rio de Janeiro - RJ",
    dueDate: "2024-03-05",
    paymentMethod: "boleto",
    type: "pf",
  },
];

interface NewClientFormProps {
  onSubmit: (client: Partial<Client>) => void;
  onClose: () => void;
}

const NewClientForm = ({ onSubmit, onClose }: NewClientFormProps) => {
  const [clientType, setClientType] = useState<"pf" | "pj">("pj");
  const [formData, setFormData] = useState<Partial<Client>>({
    email: "",
    type: "pj",
    companyName: "",
    cnpj: "",
    partnerName: "",
    partnerCpf: "",
    address: "",
    dueDate: "",
    paymentMethod: "pix",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      status: "active",
      totalBilling: 0,
    });
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
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="partnerCpf">CPF do sócio</Label>
              <Input
                id="partnerCpf"
                value={formData.partnerCpf}
                onChange={(e) => setFormData({ ...formData, partnerCpf: e.target.value })}
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
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Qual a melhor maneira de pagamento?</Label>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value: "pix" | "boleto" | "credit_card") => 
              setFormData({ ...formData, paymentMethod: value })
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
  const [clients, setClients] = useState(mockClients);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleChange = (id: string, field: keyof Client, value: string | number) => {
    setClients(prevClients =>
      prevClients.map(client =>
        client.id === id ? { ...client, [field]: value } : client
      )
    );
  };

  const handleNewClient = (client: Partial<Client>) => {
    setClients(prev => [...prev, client as Client]);
    toast({
      title: "Cliente adicionado",
      description: "O novo cliente foi cadastrado com sucesso.",
    });
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Dialog>
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
              onClose={() => document.querySelector<HTMLButtonElement>('[role="dialog"] button[type="button"]')?.click()}
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
                      value={client.totalBilling.toFixed(2)}
                      onChange={(value) => handleChange(client.id, 'totalBilling', parseFloat(value) || 0)}
                      type="number"
                    />
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <EditableCell
                      value={client.lastPayment || ""}
                      onChange={(value) => handleChange(client.id, 'lastPayment', value)}
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
