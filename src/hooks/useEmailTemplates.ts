
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@/types/email";
import { fetchTemplates, updateTemplate, deleteTemplate } from "@/services/templateService";

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
      
      setSavedTemplates(prev => prev.map(template => 
        template.id === updatedTemplate.id ? updatedTemplate : 
        (template.type === updatedTemplate.type && 
         template.subtype === updatedTemplate.subtype && 
         updatedTemplate.is_default) ? { ...template, is_default: false } : 
        template
      ));

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

  const handleTemplateDelete = async (templateId: string, type: string, subtype: string) => {
    try {
      // Check if this is the only template of its type
      const templatesOfSameType = savedTemplates.filter(t => 
        t.type === type && t.subtype === subtype
      );

      if (templatesOfSameType.length <= 1) {
        toast({
          title: "Não é possível excluir",
          description: `É necessário manter pelo menos um template para ${getTemplateTypeLabel(type, subtype)}.`,
          variant: "destructive",
        });
        return;
      }

      const template = savedTemplates.find(t => t.id === templateId);
      if (!template) return;

      await deleteTemplate(templateId, type, subtype);
      setSavedTemplates(prev => prev.filter(template => template.id !== templateId));
      toast({
        title: "Template excluído",
        description: `O template "${template.name}" (${getTemplateTypeLabel(type, subtype)}) foi excluído com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erro ao excluir template",
        description: error.message || "Não foi possível excluir o template. Por favor, tente novamente.",
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
    handleTemplateDelete
  };
};
