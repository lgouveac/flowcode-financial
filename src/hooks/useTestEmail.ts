
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@/types/email";

interface UseTestEmailProps {
  type: 'clients' | 'employees';
  template: Partial<EmailTemplate>;
}

export const useTestEmail = ({ type, template }: UseTestEmailProps) => {
  const { toast } = useToast();
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: testData } = useQuery({
    queryKey: ['test-data', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(type)
        .select('id, name, email')
        .order('name');
        
      if (error) {
        console.error(`Error fetching ${type}:`, error);
        throw error;
      }
      
      return data || [];
    },
    enabled: testEmailOpen,
  });

  const getTestData = (id?: string) => {
    const baseData = {
      nome_cliente: "João Silva",
      valor_cobranca: "R$ 1.500,00",
      data_vencimento: "15/04/2024",
      plano_servico: "Plano Premium",
      nome_funcionario: "Maria Santos",
      valor_nota: "R$ 3.000,00",
      mes_referencia: "Março/2024",
      total_horas: "160"
    };

    if (!id || !testData) return baseData;

    const selected = testData.find(item => item.id === id);
    if (!selected) return baseData;

    if (type === 'clients') {
      return {
        ...baseData,
        nome_cliente: selected.name,
      };
    } else {
      return {
        ...baseData,
        nome_funcionario: selected.name,
      };
    }
  };

  const handleTestEmail = async () => {
    try {
      if (!testEmail) {
        toast({
          title: "E-mail necessário",
          description: "Por favor, informe um e-mail para teste.",
          variant: "destructive",
        });
        return;
      }

      const previewData = getTestData(selectedId);
      const loadingToast = toast({
        title: "Enviando e-mail de teste...",
        description: "Aguarde um momento.",
      });

      console.log("Sending test email with data:", {
        type: template.type,
        subtype: template.subtype,
        templateId: template.id,
        to: testEmail,
        data: previewData
      });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: template.type,
          subtype: template.subtype,
          templateId: template.id,
          to: testEmail,
          data: previewData,
        },
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      console.log('Email function response:', data);

      toast({
        title: "Email de teste enviado",
        description: "O email de teste foi enviado com sucesso!",
      });

      setTestEmailOpen(false);
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email de teste. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  return {
    testEmailOpen,
    setTestEmailOpen,
    testEmail,
    setTestEmail,
    selectedId,
    setSelectedId,
    testData,
    handleTestEmail,
    getTestData,
  };
};
