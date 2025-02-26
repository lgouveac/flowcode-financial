
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Record, EmailTemplate, EmailData } from "../types/emailTest";

export const useEmailTest = (template: EmailTemplate) => {
  const { toast } = useToast();
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");

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
        return data as Record[];
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
        }));
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
        }));
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

      const emailData = prepareEmailData(record, template);
      console.log("Sending email with data:", emailData);

      const { error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "O email de teste foi enviado com sucesso.",
      });

      return true;
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Não foi possível enviar o email de teste.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    selectedRecordId,
    setSelectedRecordId,
    records,
    isLoading,
    handleTestEmail,
  };
};

const prepareEmailData = (record: Record, template: EmailTemplate): EmailData => {
  let emailData: EmailData = {
    to: 'client' in record ? record.client.email : record.email,
    subject: template.subject,
    content: template.content,
  };

  if (!('client' in record)) {
    // Employee case
    emailData = {
      ...emailData,
      nome_funcionario: record.name,
    };
  } else if ('due_day' in record) {
    // Recurring billing case
    const dueDate = new Date();
    dueDate.setDate(record.due_day);

    emailData = {
      ...emailData,
      nome_cliente: record.client.name,
      valor_cobranca: record.amount,
      data_vencimento: dueDate.toISOString(),
      plano_servico: record.description,
      numero_parcela: record.current_installment,
      total_parcelas: record.installments,
      forma_pagamento: record.payment_method,
    };
  } else {
    // One-time payment case
    emailData = {
      ...emailData,
      nome_cliente: record.client.name,
      valor_cobranca: record.amount,
      data_vencimento: record.due_date,
      descricao_servico: record.description,
      forma_pagamento: record.payment_method,
    };
  }

  return emailData;
};
