
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, MailIcon, PhoneIcon } from "lucide-react";
import { useState } from "react";
import { EditableCell } from "./EditableCell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "overdue";
  totalBilling: number;
  lastPayment?: string;
  cnpj?: string;
  responsibleName?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
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
    responsibleName: "João Silva",
    responsibleEmail: "joao@techsolutions.com",
    responsiblePhone: "(11) 98765-4321",
  },
  {
    id: "2",
    name: "Digital Marketing Co",
    email: "financeiro@digitalmarket.com",
    phone: "(11) 98888-8888",
    status: "overdue",
    totalBilling: 8500.00,
    lastPayment: "05/02/2024",
    cnpj: "98.765.432/0001-10",
    responsibleName: "Maria Santos",
    responsibleEmail: "maria@digitalmarket.com",
    responsiblePhone: "(11) 91234-5678",
  },
];

interface NewClientFormProps {
  onSubmit: (client: Partial<Client>) => void;
  onClose: () => void;
}

const NewClientForm = ({ onSubmit, onClose }: NewClientFormProps) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    cnpj: "",
    name: "",
    responsibleName: "",
    responsibleEmail: "",
    responsiblePhone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      status: "active",
      totalBilling: 0,
      email: formData.responsibleEmail || "",
      phone: formData.responsiblePhone || "",
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            required
            placeholder="00.000.000/0001-00"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">Razão Social</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="responsibleName">Responsável</Label>
          <Input
            id="responsibleName"
            value={formData.responsibleName}
            onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="responsibleEmail">E-mail do Responsável</Label>
          <Input
            id="responsibleEmail"
            type="email"
            value={formData.responsibleEmail}
            onChange={(e) => setFormData({ ...formData, responsibleEmail: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="responsiblePhone">Celular do Responsável</Label>
          <Input
            id="responsiblePhone"
            value={formData.responsiblePhone}
            onChange={(e) => setFormData({ ...formData, responsiblePhone: e.target.value })}
            required
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Clientes</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
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
            <thead className="bg-muted">
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nome</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contato</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Faturamento Total</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Último Pagamento</th>
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
                  <td className="p-4">
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
                  <td className="p-4">
                    <EditableCell
                      value={client.totalBilling.toFixed(2)}
                      onChange={(value) => handleChange(client.id, 'totalBilling', parseFloat(value) || 0)}
                      type="number"
                    />
                  </td>
                  <td className="p-4">
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
