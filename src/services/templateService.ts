
import { supabase } from "@/integrations/supabase/client";
import { EmailTemplate } from "@/types/email";
import { validateTemplate, validateTemplateType, validateTemplateSubtype } from "@/utils/templateValidation";

export const fetchTemplates = async () => {
  const { data: rawData, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (rawData || []).reduce<EmailTemplate[]>((acc, template) => {
    if (validateTemplateType(template.type) && validateTemplateSubtype(template.subtype)) {
      acc.push({
        ...template,
        type: template.type,
        subtype: template.subtype,
      });
    }
    return acc;
  }, []);
};

export const updateTemplate = async (updatedTemplate: EmailTemplate) => {
  if (updatedTemplate.is_default) {
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
};

export const deleteTemplate = async (templateId: string) => {
  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', templateId);

  if (error) throw error;
};

export const createTemplate = async (newTemplate: Partial<EmailTemplate>) => {
  if (!validateTemplate(newTemplate)) {
    throw new Error('Invalid template type or subtype');
  }

  if (newTemplate.is_default) {
    const { error: updateError } = await supabase
      .from('email_templates')
      .update({ is_default: false })
      .eq('type', newTemplate.type!)
      .eq('subtype', newTemplate.subtype!);

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

  if (!validateTemplateType(data.type) || !validateTemplateSubtype(data.subtype)) {
    throw new Error('Invalid template type or subtype in response');
  }

  return {
    ...data,
    type: data.type,
    subtype: data.subtype,
  } as EmailTemplate;
};

