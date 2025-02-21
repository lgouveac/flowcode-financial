import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { EditableCell } from "./EditableCell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { usePayments } from "@/hooks/usePayments";
import type { Payment } from "@/types/database";

interface NewPaymentFormProps {
  isRecurring: boolean;
  onSubmit: (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

const NewPaymentForm = ({ isRecurring, onSubmit, onClose }: NewPaymentFormProps) => {
  const [formData, setFormData] = useState<Partial<Payment>>({
    client_name: "",
    service: "",
    value: 0,
    status: "pending",
    type: isRecurring ? "recurring" : "onetime"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Omit<Payment, 'id' | 'created_at' | 'updated_at'>);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="clientName" className="text-sm font-medium">Nome do Cliente</label>
        <Input
          id="clientName"
          value={formData.client_name}
          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
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
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
  const { recurringPayments, oneTimePayments, isLoading, error, createPayment, updatePayment } = usePayments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("recurring");
  const { toast } = useToast();

  const handleChange = async (id: string, field: keyof Payment, value: string | number) => {
    try {
      await updatePayment.mutateAsync({ id, [field]: value });
      toast({
        title: "Recebimento atualizado",
        description: "As alterações foram salvas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o recebimento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleNewPayment = async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createPayment.mutateAsync(payment);
      setDialogOpen(false);
      toast({
        title: "Recebimento criado",
        description: "O novo recebimento foi adicionado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o recebimento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar os recebimentos. Por favor, tente novamente.
      </div>
    );
  }

  const renderTable = (payments: Payment[], isRecurring: boolean) => (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="w-full overflow-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-zinc-50">
            <tr className="text-left">
              <th className="px-6 py-3 text-sm font-medium text-muted-foreground">Cliente</th>
              <th className="px-6 py-3 text-sm font-medium text-muted-foreground">Serviço</th>
              <th className="px-6 py-3 text-sm font-medium text-muted-foreground">Valor</th>
              {isRecurring ? (
                <>
                  <th className="px-6 py-3 text-sm font-medium text-muted-foreground">Frequência</th>
                  <th className="px-6 py-3 text-sm font-medium text-muted-foreground">Último Pagamento</th>
                  <th className="px-6 py-3 text-sm font-medium text-muted-foreground">Próximo Pagamento</th>
                </>
              ) : (
                <th className="px-6 py-3 text-sm font-medium text-muted-foreground">Data de Vencimento</th>
              )}
              <th className="px-6 py-3 text-sm font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4">
                  <EditableCell
                    value={payment.client_name}
                    onChange={(value) => handleChange(payment.id, 'client_name', value, isRecurring)}
                  />
                </td>
                <td className="px-6 py-4">
                  <EditableCell
                    value={payment.service}
                    onChange={(value) => handleChange(payment.id, 'service', value, isRecurring)}
                  />
                </td>
                <td className="px-6 py-4">
                  <EditableCell
                    value={payment.value.toString()}
                    onChange={(value) => handleChange(payment.id, 'value', parseFloat(value) || 0, isRecurring)}
                    type="number"
                  />
                </td>
                {isRecurring ? (
                  <>
                    <td className="px-6 py-4">
                      <EditableCell
                        value={payment.frequency || ""}
                        onChange={(value) => handleChange(payment.id, 'frequency', value, isRecurring)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <EditableCell
                        value={payment.last_payment || ""}
                        onChange={(value) => handleChange(payment.id, 'last_payment', value, isRecurring)}
                        type="date"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <EditableCell
                        value={payment.next_payment || ""}
                        onChange={(value) => handleChange(payment.id, 'next_payment', value, isRecurring)}
                        type="date"
                      />
                    </td>
                  </>
                ) : (
                  <td className="px-6 py-4">
                    <EditableCell
                      value={payment.due_date || ""}
                      onChange={(value) => handleChange(payment.id, 'due_date', value, isRecurring)}
                      type="date"
                    />
                  </td>
                )}
                <td className="px-6 py-4">
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
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Recebimentos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
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
      </div>

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
    </div>
  );
};
