
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, MailIcon, PhoneIcon } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "overdue";
  totalBilling: number;
  lastPayment?: string;
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
  },
  {
    id: "2",
    name: "Digital Marketing Co",
    email: "financeiro@digitalmarket.com",
    phone: "(11) 98888-8888",
    status: "overdue",
    totalBilling: 8500.00,
    lastPayment: "05/02/2024",
  },
];

export const ClientTable = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Clientes</h1>
        <Button className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Novo Cliente
        </Button>
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
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mockClients.map((client) => (
                <tr key={client.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4">
                    <div className="font-medium">{client.name}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col space-y-1 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MailIcon className="h-4 w-4 mr-2" />
                        {client.email}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        {client.phone}
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
                  <td className="p-4 font-medium">
                    R$ {client.totalBilling.toFixed(2)}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {client.lastPayment}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        Ver Faturas
                      </Button>
                    </div>
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
