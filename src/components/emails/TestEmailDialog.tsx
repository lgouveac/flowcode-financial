
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { EmailTemplate } from "@/types/email";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TestEmailDialogProps {
  template: EmailTemplate;
  open: boolean;
  onClose: () => void;
}

interface RecurringBilling {
  id: string;
  amount: number;
  description: string;
  due_day: number;
  installments: number;
  current_installment: number;
  payment_method: string;
  client: {
    name: string;
    email: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  description: string;
  due_date: string;
  payment_method: string;
  client: {
    name: string;
    email: string;
  };
}

type Employee = {
  id: string;
  name: string;
  email: string;
};

type Record = RecurringBilling | Payment | Employee;

export const TestEmailDialog = ({ template, open, onClose }: TestEmailDialogProps) => {
  const { toast } = useToast();
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");

  // Fetch billing records based on template type and subtype
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["billing-records", template.type, template.subtype],
    queryFn: async () => {
      if (template.type === "employees") {
        const { data, error } = await supabase
          .from("employees")
          .select("id, name, email")
          .eq("status", "active")
          .order("name");
        if (error) throw error;
        return data as Employee[];
      } else if (template.subtype === "recurring") {
        const { data, error } = await supabase
          .from("recurring_billing")
          .select(`
            id,
            amount,
            description,
            due_day,
            installments,
            current_installment,
            payment_method,
            clients (
              name,
              email
            )
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(record => ({
          ...record,
          client: record.clients
        })) as RecurringBilling[];
      } else {
        const { data, error } = await supabase
          .from("payments")
          .select(`
            id,
            amount,
            description,
            due_date,
            payment_method,
            clients (
              name,
              email
            )
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(record => ({
          ...record,
          client: record.clients
        })) as Payment[];
      }
    },
  });

  const handleTestEmail = async () => {
    if (!selectedRecordId) {
      toast({
        title: "Selecione um registro",
        description: "Por favor, selecione um registro para enviar o email de teste.",
        variant: "destructive",
      });
      return;
    }

    try {
      const record = records.find(r => r.id === selectedRecordId);
      if (!record) throw new Error("Registro não encontrado");

      let emailData;
      if (template.type === "employees") {
        const employee = record as Employee;
        emailData = {
          to: employee.email,
          subject: template.subject,
          content: template.content,
          recipientName: employee.name
        };
      } else if (template.subtype === "recurring") {
        const billing = record as RecurringBilling;
        emailData = {
          to: billing.client.email,
          subject: template.subject,
          content: template.content,
          recipientName: billing.client.name,
          amount: billing.amount,
          description: billing.description,
          dueDay: billing.due_day,
          installments: billing.installments,
          currentInstallment: billing.current_installment,
          paymentMethod: billing.payment_method
        };
      } else {
        const payment = record as Payment;
        emailData = {
          to: payment.client.email,
          subject: template.subject,
          content: template.content,
          recipientName: payment.client.name,
          amount: payment.amount,
          description: payment.description,
          dueDate: payment.due_date,
          paymentMethod: payment.payment_method
        };
      }

      const { error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "O email de teste foi enviado com sucesso.",
      });

      onClose();
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Não foi possível enviar o email de teste.",
        variant: "destructive",
      });
    }
  };

  const getRecordLabel = (record: Record) => {
    if ('client' in record) {
      return `${record.client.name} - ${record.description}`;
    } else {
      return record.name;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Email de Teste</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Selecione o registro</Label>
            <Select
              value={selectedRecordId}
              onValueChange={setSelectedRecordId}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  isLoading 
                    ? "Carregando..." 
                    : template.type === "employees" 
                      ? "Selecione um funcionário"
                      : template.subtype === "recurring"
                        ? "Selecione uma cobrança recorrente"
                        : "Selecione uma cobrança pontual"
                } />
              </SelectTrigger>
              <SelectContent>
                {records.map((record) => (
                  <SelectItem key={record.id} value={record.id}>
                    {getRecordLabel(record)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleTestEmail}>
              Enviar Teste
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

