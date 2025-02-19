
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { EditableCell } from "./EditableCell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface Payment {
  id: string;
  clientName: string;
  service: string;
  value: string;
  frequency?: string;
  lastPayment?: string;
  nextPayment?: string;
  dueDate?: string;
  status: "active" | "inactive" | "pending";
}

const mockRecurringPayments: Payment[] = [
  {
    id: "1",
    clientName: "Tech Solutions Ltda",
    service: "Consultoria Mensal",
    value: "5000.00",
    frequency: "Mensal",
    lastPayment: "2024-02-15",
    nextPayment: "2024-03-15",
    status: "active"
  },
  {
    id: "2",
    clientName: "Digital Marketing Co",
    service: "Manutenção de Sistema",
    value: "3500.00",
    frequency: "Mensal",
    lastPayment: "2024-02-10",
    nextPayment: "2024-03-10",
    status: "pending"
  }
];

const mockOneTimePayments: Payment[] = [
  {
    id: "3",
    clientName: "Startup XYZ",
    service: "Projeto Especial",
    value: "12000.00",
    dueDate: "2024-03-30",
    status: "pending"
  },
  {
    id: "4",
    clientName: "Construtora ABC",
    service: "Consultoria Pontual",
    value: "8000.00",
    dueDate: "2024-04-15",
    status: "active"
  }
];

interface NewPaymentFormProps {
  isRecurring: boolean;
  onSubmit: (payment: Partial<Payment>) => void;
  onClose: () => void;
}

const NewPaymentForm = ({ isRecurring, onSubmit, onClose }: NewPaymentFormProps) => {
  const [formData, setFormData] = useState<Partial<Payment>>({
    clientName: "",
    service: "",
    value: "",
    status: "pending"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="clientName" className="text-sm font-medium">Nome do Cliente</label>
        <Input
          id="clientName"
          value={formData.clientName}
          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="service" className="text-sm font-medium">Serviço</label>
        <Input
          id="service"
          value={formData.service}
          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="value" className="text-sm font-medium">Valor</label>
        <Input
          id="value"
          type="number"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          required
        />
      </div>
      {isRecurring && (
        <div className="space-y-2">
          <label htmlFor="frequency" className="text-sm font-medium">Frequência</label>
          <Input
            id="frequency"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            required
          />
        </div>
      )}
      {!isRecurring && (
        <div className="space-y-2">
          <label htmlFor="dueDate" className="text-sm font-medium">Data de Vencimento</label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>
      )}
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

export const RecurringBilling = () => {
  const [recurringPayments, setRecurringPayments] = useState(mockRecurringPayments);
  const [oneTimePayments, setOneTimePayments] = useState(mockOneTimePayments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("recurring");
  const { toast } = useToast();

  const handleChange = (id: string, field: keyof Payment, value: string, isRecurring: boolean) => {
    const updatePayments = isRecurring ? setRecurringPayments : setOneTimePayments;
    const payments = isRecurring ? recurringPayments : oneTimePayments;
    
    updatePayments(prevPayments =>
      prevPayments.map(payment =>
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };

  const handleNewPayment = (payment: Partial<Payment>) => {
    const newPayment = {
      ...payment,
      id: Math.random().toString(36).substr(2, 9),
      status: "pending"
    } as Payment;

    if (selectedTab === "recurring") {
      setRecurringPayments(prev => [...prev, newPayment]);
    } else {
      setOneTimePayments(prev => [...prev, newPayment]);
    }

    toast({
      title: "Recebimento criado",
      description: "O novo recebimento foi adicionado com sucesso."
    });
  };

  const renderTable = (payments: Payment[], isRecurring: boolean) => (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Serviço
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Valor
                </th>
                {isRecurring ? (
                  <>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Frequência
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Último Pagamento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Próximo Pagamento
                    </th>
                  </>
                ) : (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Data de Vencimento
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <EditableCell
                      value={payment.clientName}
                      onChange={(value) => handleChange(payment.id, 'clientName', value, isRecurring)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <EditableCell
                      value={payment.service}
                      onChange={(value) => handleChange(payment.id, 'service', value, isRecurring)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <EditableCell
                      value={payment.value}
                      onChange={(value) => handleChange(payment.id, 'value', value, isRecurring)}
                      type="number"
                    />
                  </td>
                  {isRecurring ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EditableCell
                          value={payment.frequency || ""}
                          onChange={(value) => handleChange(payment.id, 'frequency', value, isRecurring)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EditableCell
                          value={payment.lastPayment || ""}
                          onChange={(value) => handleChange(payment.id, 'lastPayment', value, isRecurring)}
                          type="date"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EditableCell
                          value={payment.nextPayment || ""}
                          onChange={(value) => handleChange(payment.id, 'nextPayment', value, isRecurring)}
                          type="date"
                        />
                      </td>
                    </>
                  ) : (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EditableCell
                        value={payment.dueDate || ""}
                        onChange={(value) => handleChange(payment.id, 'dueDate', value, isRecurring)}
                        type="date"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      payment.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : payment.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {payment.status === "active" ? "Ativo" 
                        : payment.status === "pending" ? "Pendente" 
                        : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="shadow-sm w-full">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <CardTitle className="text-xl font-display">Recebimentos</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-500 hover:bg-blue-600">
              <PlusIcon className="h-4 w-4" />
              Novo Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Recebimento {selectedTab === "recurring" ? "Recorrente" : "Avulso"}</DialogTitle>
            </DialogHeader>
            <NewPaymentForm
              isRecurring={selectedTab === "recurring"}
              onSubmit={handleNewPayment}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
            <TabsTrigger value="onetime">Avulsos</TabsTrigger>
          </TabsList>
          <TabsContent value="recurring">
            {renderTable(recurringPayments, true)}
          </TabsContent>
          <TabsContent value="onetime">
            {renderTable(oneTimePayments, false)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
