
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmailTemplate } from "@/types/email";

export const useEmailTest = (template: EmailTemplate) => {
  const { toast } = useToast();
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

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
    }
  }, [selectedRecordId, records]);

  const fetchRecords = async () => {
    setIsLoadingRecords(true);
    setError(null);
    
    try {
      let data: any[] = [];
      
      if (template.type === 'clients') {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name, email, responsible_name, partner_name')
          .order('name')
          .limit(50);
        
        if (clientsError) throw clientsError;
        
        data = [...clientsData];
      } else if (template.type === 'employees') {
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, name, email')
          .limit(50);
        
        if (employeeError) throw employeeError;
        
        data = [...employeeData];
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
      setPreviewData({
        clientName: record.name || "Cliente",
        responsibleName: record.responsible_name || record.partner_name || "Responsável",
        amount: 100, // Default test value
        dueDay: 15, // Default test day
        description: "Serviço de teste",
        totalInstallments: 1,
        currentInstallment: 1,
        paymentMethod: "pix"
      });
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
      
      if (!selectedRecordId) {
        throw new Error('Por favor, selecione um registro primeiro');
      }
      
      const record = records.find(r => r.id === selectedRecordId);
      if (!record || !record.email) {
        throw new Error('Email do registro não encontrado');
      }
      
      const emailData: any = {
        templateId: template.id,
        type: template.type,
        subtype: template.subtype,
        to: record.email,
        data: {
          recipientName: record.name,
          responsibleName: record.responsible_name || record.partner_name,
          billingValue: 100,
          dueDate: new Date().toISOString().split('T')[0],
          currentInstallment: 1,
          totalInstallments: 1,
          paymentMethod: "pix",
          descricaoServico: "Serviço de teste"
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

  return {
    selectedRecordId,
    setSelectedRecordId,
    selectedRecord,
    records,
    isLoadingRecords,
    isSendingEmail,
    handleRecordSelect,
    handleTestEmail,
    error,
    previewData
  };
};
