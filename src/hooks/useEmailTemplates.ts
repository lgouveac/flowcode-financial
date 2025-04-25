
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@/types/email";
import { fetchTemplates, updateTemplate } from "@/services/templateService";

// Include novo_subtipo in type label logic
export const useEmailTemplates = () => {
  const { toast } = useToast();
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getTemplateTypeLabel = (type: string, subtype: string) => {
    if (type === 'clients') {
      if (subtype === 'recurring') return 'Cobrança Recorrente';
      if (subtype === 'oneTime') return 'Cobrança Pontual';
      if (subtype === 'reminder') return 'Lembrete de Pagamento';
      if (subtype === 'contract') return 'Contrato';
      if (subtype === 'novo_subtipo') return 'Novo Subtipo';
    }
    if (type === 'employees') {
      if (subtype === 'invoice') return 'Nota Fiscal';
      if (subtype === 'hours') return 'Horas';
      if (subtype === 'novo_subtipo') return 'Novo Subtipo';
    }
    return subtype;
  };

  // Validation list now includes 'novo_subtipo'
  const validateTemplates = (templates: EmailTemplate[]) => {
    const requiredTemplates = [
      { type: 'employees', subtype: 'invoice' },
      { type: 'employees', subtype: 'hours' },
      { type: 'clients', subtype: 'recurring' },
      { type: 'clients', subtype: 'oneTime' },
      { type: 'clients', subtype: 'contract' },
    ];

    const missingTemplates = requiredTemplates.filter(required => {
      return !templates.some(template => 
        template.type === required.type && template.subtype === required.subtype
      );
    });

    if (missingTemplates.length > 0) {
      const missingTypes = missingTemplates.map(t => 
        `${getTemplateTypeLabel(t.type, t.subtype)}`
      ).join(', ');

      toast({
        title: "Templates obrigatórios faltando",
        description: `É necessário ter um template para cada tipo. Faltando: ${missingTypes}`,
        variant: "destructive",
      });
    }

    return missingTemplates.length === 0;
  };

  const fetchAndSetTemplates = async () => {
    try {
      const templates = await fetchTemplates();
      console.log("Fetched templates:", templates);
      setSavedTemplates(templates);
      validateTemplates(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Erro ao carregar templates",
        description: "Não foi possível carregar os templates. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateUpdate = async (updatedTemplate: EmailTemplate) => {
    try {
      await updateTemplate(updatedTemplate);
      console.log('Template updated successfully:', updatedTemplate);
      
      // Atualiza o template na lista
      setSavedTemplates(prev => prev.map(template => {
        if (template.id === updatedTemplate.id) {
          return updatedTemplate;
        }
        return template;
      }));

      // Recarrega os templates para garantir que temos o estado mais atualizado
      fetchAndSetTemplates();

      toast({
        title: "Template atualizado",
        description: `O template "${updatedTemplate.name}" (${getTemplateTypeLabel(updatedTemplate.type, updatedTemplate.subtype)}) foi atualizado com sucesso.`,
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Erro ao atualizar template",
        description: `Não foi possível atualizar o template "${updatedTemplate.name}". Por favor, tente novamente.`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAndSetTemplates();
  }, []);

  return {
    savedTemplates,
    isLoading,
    handleTemplateUpdate,
    refreshTemplates: fetchAndSetTemplates
  };
};
