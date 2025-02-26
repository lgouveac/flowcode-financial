
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { EmailTemplate } from "@/types/email";
import { supabase } from "@/integrations/supabase/client";

const validateTemplateType = (type: string): type is 'clients' | 'employees' => {
  return type === 'clients' || type === 'employees';
};

const validateTemplateSubtype = (subtype: string): subtype is 'recurring' | 'oneTime' | 'invoice' | 'hours' => {
  return ['recurring', 'oneTime', 'invoice', 'hours'].includes(subtype);
};

export const useEmailTemplates = () => {
  const { toast } = useToast();
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const { data: rawData, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validTemplates = (rawData || []).reduce<EmailTemplate[]>((acc, template) => {
        if (validateTemplateType(template.type) && validateTemplateSubtype(template.subtype)) {
          acc.push({
            ...template,
            type: template.type,
            subtype: template.subtype,
          });
        }
        return acc;
      }, []);

      setSavedTemplates(validTemplates);
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
      if (updatedTemplate.is_default) {
        // If setting as default, first remove default status from other templates of same type/subtype
        const { error: updateError } = await supabase
          .from('email_templates')
          .update({ is_default: false })
          .eq('type', updatedTemplate.type)
          .eq('subtype', updatedTemplate.subtype);

        if (updateError) throw updateError;
      }

      const { error } = await supabase
        .from('email_templates')
        .update({
          name: updatedTemplate.name,
          subject: updatedTemplate.subject,
          content: updatedTemplate.content,
          is_default: updatedTemplate.is_default,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedTemplate.id);

      if (error) throw error;

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

  const handleTemplateDelete = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setSavedTemplates(prev => prev.filter(template => template.id !== templateId));
      toast({
        title: "Template excluído",
        description: "O template foi excluído com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erro ao excluir template",
        description: "Não foi possível excluir o template. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const saveNewTemplate = async (newTemplate: Partial<EmailTemplate>) => {
    try {
      if (!validateTemplateType(newTemplate.type!) || !validateTemplateSubtype(newTemplate.subtype!)) {
        throw new Error('Invalid template type or subtype');
      }

      if (newTemplate.is_default) {
        // If setting as default, first remove default status from other templates of same type/subtype
        const { error: updateError } = await supabase
          .from('email_templates')
          .update({ is_default: false })
          .eq('type', newTemplate.type)
          .eq('subtype', newTemplate.subtype);

        if (updateError) throw updateError;
      }

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: newTemplate.name,
          subject: newTemplate.subject,
          content: newTemplate.content,
          type: newTemplate.type,
          subtype: newTemplate.subtype,
          is_default: newTemplate.is_default || false,
        })
        .select()
        .single();

      if (error) throw error;

      if (validateTemplateType(data.type) && validateTemplateSubtype(data.subtype)) {
        const validTemplate: EmailTemplate = {
          ...data,
          type: data.type,
          subtype: data.subtype,
        };

        setSavedTemplates(prev => [validTemplate, ...prev.map(t => 
          t.type === validTemplate.type && 
          t.subtype === validTemplate.subtype && 
          validTemplate.is_default ? { ...t, is_default: false } : t
        )]);

        toast({
          title: "Template Salvo",
          description: "O template de e-mail foi salvo com sucesso.",
        });

        return true;
      }
      return false;
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
    fetchTemplates();
  }, []);

  return {
    savedTemplates,
    isLoading,
    handleTemplateUpdate,
    handleTemplateDelete,
    saveNewTemplate
  };
};
