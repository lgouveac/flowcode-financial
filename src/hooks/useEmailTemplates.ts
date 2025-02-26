
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@/types/email";
import { fetchTemplates, updateTemplate, deleteTemplate, createTemplate } from "@/services/templateService";

export const useEmailTemplates = () => {
  const { toast } = useToast();
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetTemplates = async () => {
    try {
      const templates = await fetchTemplates();
      setSavedTemplates(templates);
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
        description: "O template foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Erro ao atualizar template",
        description: "Não foi possível atualizar o template. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleTemplateDelete = async (templateId: string, type: string, subtype: string) => {
    try {
      await deleteTemplate(templateId, type, subtype);
      setSavedTemplates(prev => prev.filter(template => template.id !== templateId));
      toast({
        title: "Template excluído",
        description: "O template foi excluído com sucesso.",
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

  const saveNewTemplate = async (newTemplate: Partial<EmailTemplate>) => {
    try {
      const savedTemplate = await createTemplate(newTemplate);
      
      setSavedTemplates(prev => [savedTemplate, ...prev.map(t => 
        t.type === savedTemplate.type && 
        t.subtype === savedTemplate.subtype && 
        savedTemplate.is_default ? { ...t, is_default: false } : t
      )]);

      toast({
        title: "Template Salvo",
        description: "O template de e-mail foi salvo com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro ao salvar template",
        description: "Não foi possível salvar o template. Por favor, tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchAndSetTemplates();
  }, []);

  return {
    savedTemplates,
    isLoading,
    handleTemplateUpdate,
    handleTemplateDelete,
    saveNewTemplate
  };
};
