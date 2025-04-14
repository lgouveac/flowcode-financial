
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Record, EmailData, RecordType } from "../types/emailTest";
import type { EmailTemplate } from "@/types/email";

export const useEmailTest = (template: EmailTemplate) => {
  const { toast } = useToast();
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [recordType, setRecordType] = useState<RecordType>("all");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["billing-records", template.type, template.subtype, recordType],
    queryFn: async () => {
      if (template.type === "employees") {
        const { data, error } = await supabase
          .from("employees")
          .select("id, name, email")
          .eq("status", "active")
          .order("name");
        if (error) throw error;
        return data as Record[];
      } 
      
      // For client templates
      let recurringRecords: Record[] = [];
      let oneTimeRecords: Record[] = [];
      
      // Fetch recurring billing records if needed
      if (recordType === "all" || recordType === "recurring") {
        console.log("Fetching recurring records");
        const { data: recurringData, error: recurringError } = await supabase
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
              id,
              name,
              email,
              partner_name
            )
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
          
        if (recurringError) throw recurringError;
        
        recurringRecords = (recurringData || []).map(record => ({
          ...record,
          client: record.clients
        }));
        
        console.log("Recurring records fetched:", recurringRecords.length);
        console.log("Recurring records:", recurringRecords);
      }
      
      // Fetch one-time payment records if needed
      if (recordType === "all" || recordType === "oneTime") {
        console.log("Fetching one-time records");
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select(`
            id,
            amount,
            description,
            due_date,
            payment_method,
            status,
            clients (
              id,
              name,
              email,
              partner_name
            )
          `)
          .is("installment_number", null)  // Ensure we only get one-time payments
          .not("status", "in", '("cancelled")')  // Exclude cancelled payments
          .order("created_at", { ascending: false });
          
        if (paymentsError) throw paymentsError;
        
        oneTimeRecords = (paymentsData || []).map(record => ({
          ...record,
          client: record.clients
        }));
        
        console.log("One-time records fetched:", oneTimeRecords.length);
        console.log("One-time records:", oneTimeRecords);
      }
      
      // Return the appropriate records based on filter
      if (recordType === "recurring") {
        return recurringRecords;
      } else if (recordType === "oneTime") {
        return oneTimeRecords;
      } else {
        return [...recurringRecords, ...oneTimeRecords];
      }
    },
  });

  // Reset selected record when record type changes
  useEffect(() => {
    setSelectedRecordId("");
  }, [recordType]);

  const handleTestEmail = async () => {
    if (!selectedRecordId) {
      toast({
        title: "Selecione um registro",
        description: "Por favor, selecione um registro para enviar o email de teste.",
        variant: "destructive",
      });
      return false;
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
    recordType,
    setRecordType,
    records,
    isLoading,
    handleTestEmail,
  };
};

const prepareEmailData = (record: Record, template: EmailTemplate): EmailData => {
  let emailData: EmailData = {
    to: 'client' in record ? record.client.email || '' : record.email,
    subject: template.subject,
    content: template.content,
  };

  if (!('client' in record)) {
    // Employee case
    emailData = {
      ...emailData,
      nome_funcionario: record.name,
    };
    
    // Add employee specific variables based on template subtype
    if (template.subtype === 'invoice') {
      emailData.valor_nota = 0; // Default value, would be replaced with actual data
      emailData.data_nota = new Date().toISOString().split('T')[0]; // Default to today
    } else if (template.subtype === 'hours') {
      emailData.total_horas = 0; // Default value
      emailData.periodo = `${new Date().getMonth() + 1}/${new Date().getFullYear()}`; // Current month/year
    }
  } else if ('due_day' in record) {
    // Recurring billing case
    const dueDate = new Date();
    dueDate.setDate(record.due_day);

    emailData = {
      ...emailData,
      nome_cliente: record.client.name,
      nome_responsavel: record.client.partner_name || 'Responsável',
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
      nome_responsavel: record.client.partner_name || 'Responsável',
      valor_cobranca: record.amount,
      data_vencimento: record.due_date,
      descricao_servico: record.description,
      forma_pagamento: record.payment_method,
    };
  }

  return emailData;
};
