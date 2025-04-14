
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmailTemplate } from "@/types/email";
import { RecordType } from "../types/emailTest";

export const useEmailTest = (template: EmailTemplate) => {
  const { toast } = useToast();
  const [customEmail, setCustomEmail] = useState<string>("");
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<RecordType>("all");
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    fetchRecords();
  }, [template, recordType]);

  useEffect(() => {
    if (selectedRecordId && records.length > 0) {
      const record = records.find(r => r.id === selectedRecordId);
      if (record) {
        setSelectedRecord(record);
        updatePreviewData(record);
      }
    }
  }, [selectedRecordId, records]);

  const fetchRecords = async () => {
    setIsLoadingRecords(true);
    setError(null);
    
    try {
      let data: any[] = [];
      
      if (template.type === 'clients') {
        if (template.subtype === 'recurring' || recordType === 'recurring' || recordType === 'all') {
          const { data: recurringData, error: recurringError } = await supabase
            .from('recurring_billing') // Fixed: 'recurring_billings' -> 'recurring_billing'
            .select(`
              id, amount, due_day, description, installments, current_installment, payment_method,
              client:client_id (id, name, email, partner_name)
            `)
            .limit(50);
          
          if (recurringError) throw recurringError;
          
          data = [...data, ...recurringData];
        }
        
        if (template.subtype === 'oneTime' || recordType === 'oneTime' || recordType === 'all') {
          const { data: paymentData, error: paymentError } = await supabase
            .from('payments')
            .select(`
              id, amount, due_date, description, payment_method, status,
              client:client_id (id, name, email, partner_name)
            `)
            .order('due_date', { ascending: false })
            .limit(50);
          
          if (paymentError) throw paymentError;
          
          data = [...data, ...paymentData];
        }
      } else if (template.type === 'employees') {
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, name, email')
          .limit(50);
        
        if (employeeError) throw employeeError;
        
        data = [...data, ...employeeData];
      }
      
      setRecords(data);
    } catch (err: any) {
      console.error('Error fetching records:', err);
      setError(err.message || 'Failed to load records');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const updatePreviewData = (record: any) => {
    if (template.type === 'clients') {
      if ('client' in record) {
        // Payment or Recurring Billing
        setPreviewData({
          clientName: record.client?.name || "Cliente",
          responsibleName: record.client?.partner_name || "Responsável",
          amount: record.amount || 0,
          dueDay: record.due_day || (record.due_date ? new Date(record.due_date).getDate() : 1),
          dueDate: record.due_date,
          description: record.description || "Serviço",
          totalInstallments: record.installments || record.total_installments || 1,
          currentInstallment: record.current_installment || 1,
          paymentMethod: record.payment_method || "pix"
        });
      }
    } else {
      // Employee
      setPreviewData({
        employeeName: record.name || "Funcionário",
        employeeEmail: record.email || "email@example.com",
      });
    }
  };

  const handleRecordSelect = (id: string) => {
    setSelectedRecordId(id);
  };

  const handleTestEmail = async () => {
    try {
      setIsSendingEmail(true);
      setError(null);
      
      if (mode === 'record' && !selectedRecordId) {
        throw new Error('Please select a record first');
      }
      
      if (mode === 'custom' && !customEmail) {
        throw new Error('Please enter an email address');
      }
      
      const emailData: any = {
        templateId: template.id,
        type: template.type,
        subtype: template.subtype
      };
      
      if (mode === 'record') {
        emailData.recordId = selectedRecordId;
      } else {
        emailData.to = customEmail;
        emailData.testData = true;
      }
      
      const { data, error: apiError } = await supabase.functions.invoke('send-email', {
        body: emailData
      });
      
      if (apiError) throw apiError;
      
      toast({
        title: 'Email enviado com sucesso',
        description: 'O email de teste foi enviado para o destinatário especificado.',
      });
      
      return data;
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar o email de teste');
      toast({
        title: 'Erro ao enviar email',
        description: err.message || 'Ocorreu um erro ao enviar o email de teste.',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsSendingEmail(false);
    }
  };

  const [mode, setMode] = useState<'record' | 'custom'>('record');

  return {
    customEmail,
    setCustomEmail,
    selectedRecordId,
    setSelectedRecordId,
    selectedRecord,
    records,
    isLoadingRecords,
    isSendingEmail,
    handleRecordSelect,
    handleTestEmail,
    error,
    previewData,
    recordType,
    setRecordType,
    mode,
    setMode
  };
};
