
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmailTemplate } from "@/types/email";

export const useEmailTest = (template: EmailTemplate) => {
  const { toast } = useToast();
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetchRecords();
  }, [template]);

  useEffect(() => {
    if (selectedRecordId && records.length > 0) {
      const record = records.find(r => r.id === selectedRecordId);
      if (record) {
        setSelectedRecord(record);
        updatePreviewData(record);
      }
    } else {
      setPreviewData(null);
      setSelectedRecord(null);
    }
  }, [selectedRecordId, records]);

  // Busca somente recebimentos realmente ativos, não deletados, clientes ativos, não "overdue", "paid", "cancelled", e cliente realmente ainda existente
  const fetchRecords = async () => {
    setIsLoadingRecords(true);
    setError(null);
    try {
      let data: Record<string, unknown>[] = [];
      if (template.type === 'clients') {
        // Exibe só recebimentos ativos, com clientes ativos e que tenham email
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            *,
            clients:clients (
              id,
              name,
              email,
              responsible_name,
              partner_name,
              partner_cpf,
              cnpj,
              cpf,
              address,
              company_name,
              status
            )
          `)
          .order('due_date', { ascending: false })
          .limit(100);

        if (paymentsError) throw paymentsError;

        // Só mostrar recebimentos com clientes realmente ativos/vivos e que tenham email
        data = paymentsData
          .filter(payment => {
            const client = payment.clients;
            const clientActive = client && client.status === 'active';
            const clientEmailExists = client && !!client.email;
            const paymentStatusOk = !["overdue", "cancelled", "paid"].includes(payment.status);
            // Tira pagamentos sem cliente (soft/foreign delete)
            return !!client && clientActive && clientEmailExists && paymentStatusOk;
          })
          .map(payment => ({
            id: payment.id,
            name: `${payment.clients.name} - ${payment.description} (${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(payment.amount)})`,
            email: payment.clients.email,
            // Enviar objeto completo do cliente
            client: {
              ...payment.clients
            },
            responsible_name: payment.clients.responsible_name,
            partner_name: payment.clients.partner_name,
            partner_cpf: payment.clients.partner_cpf,
            cnpj: payment.clients.cnpj,
            cpf: payment.clients.cpf,
            address: payment.clients.address,
            company_name: payment.clients.company_name,
            amount: payment.amount,
            due_date: payment.due_date,
            description: payment.description,
            installment_number: payment.installment_number || 1,
            total_installments: payment.total_installments || 1,
            payment_method: payment.payment_method,
            client_id: payment.client_id
          }));

      } else if (template.type === 'employees') {
        // Funcionários ativos com email
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, name, email, status')
          .eq('status', 'active')
          .limit(100);

        if (employeeError) throw employeeError;

        data = employeeData.filter(e => !!e.email);
      }

      setRecords(data);
    } catch (err: unknown) {
      console.error('Error fetching records:', err);
      setError(err instanceof Error ? err.message : 'Failed to load records');
      setRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Agora usa sempre o objeto client completo
  const updatePreviewData = (record: Record<string, unknown>) => {
    if (template.type === 'clients') {
      const amount = record.amount as number;
      const dueDate = record.due_date as string | undefined;
      const name = record.name as string;

      // Format currency
      const formattedAmount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(amount);

      // Format date
      const formattedDate = dueDate
        ? new Date(dueDate).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR');

      setPreviewData({
        clientName: name.split(' - ')[0] || "Cliente",
        responsibleName: (record.responsible_name as string) || (record.partner_name as string) || "Responsável",
        amount: amount,
        formattedAmount: formattedAmount,
        dueDay: dueDate ? new Date(dueDate).getDate() : new Date().getDate(),
        dueDate: formattedDate,
        description: (record.description as string) || "Serviço de teste",
        totalInstallments: record.total_installments || 1,
        currentInstallment: record.installment_number || 1,
        paymentMethod: record.payment_method || "pix",
        clientId: record.client_id,
        client: {
          ...(record.client as Record<string, unknown>) // Isso inclui cnpj, cpf, partner_name, partner_cpf, endereco, company_name etc
        }
      });
    } else {
      setPreviewData({
        employeeName: (record.name as string) || "Funcionário",
        employeeEmail: (record.email as string) || "email@example.com",
      });
    }
  };

  const handleTestEmail = async () => {
    try {
      setIsSendingEmail(true);
      setError(null);

      if (!selectedRecordId) {
        throw new Error('Por favor, selecione um registro primeiro');
      }

      const record = records.find(r => r.id === selectedRecordId);
      if (!record || !record.email) {
        throw new Error('Email do registro não encontrado');
      }

      const recordAmount = (record.amount as number) || 0;
      const recordName = record.name as string;
      const recordDueDate = record.due_date as string | undefined;

      const formattedAmount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(recordAmount);

      let paymentMethodText = 'PIX';
      if (record.payment_method === 'boleto') paymentMethodText = 'Boleto';
      if (record.payment_method === 'credit_card') paymentMethodText = 'Cartão de Crédito';

      const emailData: Record<string, unknown> = {
        templateId: template.id,
        type: template.type,
        subtype: template.subtype,
        to: record.email,
        data: {
          recipientName: recordName.split(' - ')[0] || 'Cliente',
          responsibleName: (record.responsible_name as string) || (record.partner_name as string) || 'Responsável',
          billingValue: formattedAmount,
          dueDate: recordDueDate ? new Date(recordDueDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
          currentInstallment: record.installment_number || 1,
          totalInstallments: record.total_installments || 1,
          paymentMethod: paymentMethodText,
          descricaoServico: (record.description as string) || "Serviço de teste",
          // Passando campos do cliente se houver
          ...(record.client as Record<string, unknown>),
        }
      };

      const { data, error: apiError } = await supabase.functions.invoke('send-billing-email', {
        body: emailData
      });

      if (apiError) throw apiError;

      toast({
        title: 'Email enviado com sucesso',
        description: `O email de teste foi enviado para ${record.email}`,
      });

      return data;
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Falha ao enviar o email de teste';
      setError(errMessage);
      toast({
        title: 'Erro ao enviar email',
        description: errMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsSendingEmail(false);
    }
  };

  return {
    selectedRecordId,
    setSelectedRecordId,
    selectedRecord,
    records,
    isLoadingRecords,
    isSendingEmail,
    handleTestEmail,
    error,
    previewData
  };
};
// O ARQUIVO ESTÁ FICANDO LONGO! Considere me pedir depois para refatorá-lo em hooks pequenos!
