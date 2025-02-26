
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
      .eq('subtype', updatedTemplate.subtype)
      .neq('id', updatedTemplate.id);

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

export const deleteTemplate = async (templateId: string, type: string, subtype: string) => {
  // Get all templates of this type/subtype
  const { data: templates, error: countError } = await supabase
    .from('email_templates')
    .select('id, is_default')
    .eq('type', type)
    .eq('subtype', subtype);

  if (countError) throw countError;

  // Check if this is the last template
  if (templates.length <= 1) {
    throw new Error('Cannot delete the last template of this type. You must keep at least one template for each type to ensure email functionality.');
  }

  // Get template being deleted
  const templateToDelete = templates.find(t => t.id === templateId);
  
  if (!templateToDelete) {
    throw new Error('Template not found');
  }

  // If this is the only default template, we need to ensure another one becomes default
  if (templateToDelete.is_default) {
    const { error: updateError } = await supabase
      .from('email_templates')
      .update({ is_default: true })
      .eq('type', type)
      .eq('subtype', subtype)
      .neq('id', templateId)
      .limit(1);

    if (updateError) throw updateError;
  }

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
