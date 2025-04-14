
import { EmailTemplate } from "@/types/email";

export const validateTemplateType = (type: string): type is 'clients' | 'employees' => {
  return type === 'clients' || type === 'employees';
};

export const validateTemplateSubtype = (subtype: string): subtype is 'recurring' | 'oneTime' | 'invoice' | 'hours' | 'reminder' => {
  return ['recurring', 'oneTime', 'invoice', 'hours', 'reminder'].includes(subtype);
};

export const validateTemplate = (template: Partial<EmailTemplate>): boolean => {
  if (!template.type || !template.subtype) return false;
  return validateTemplateType(template.type) && validateTemplateSubtype(template.subtype);
};
