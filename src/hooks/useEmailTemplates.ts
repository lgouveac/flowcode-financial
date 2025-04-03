
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@/types/email";
import { fetchTemplates, updateTemplate } from "@/services/templateService";

export const useEmailTemplates = () => {
  const { toast } = useToast();
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getTemplateTypeLabel = (type: string, subtype: string) => {
    if (type === 'clients') {
      return subtype === 'recurring' ? 'Cobrança Recorrente' : 'Cobrança Pontual';
    }
    return subtype === 'invoice' ? 'Nota Fiscal' : 'Horas';
  };

  const validateTemplates = (templates: EmailTemplate[]) => {
    const requiredTemplates = [
      { type: 'employees', subtype: 'invoice' },
      { type: 'employees', subtype: 'hours' },
      { type: 'clients', subtype: 'recurring' },
      { type: 'clients', subtype: 'oneTime' }
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
