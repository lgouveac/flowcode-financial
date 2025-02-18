
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, MailIcon, PhoneIcon } from "lucide-react";
import { useState } from "react";
import { EditableCell } from "./EditableCell";

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
  const [clients, setClients] = useState(mockClients);

  const handleChange = (id: string, field: keyof Client, value: string | number) => {
    setClients(prevClients =>
      prevClients.map(client =>
        client.id === id ? { ...client, [field]: value } : client
      )
    );
  };

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
