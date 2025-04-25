
import { EmailTemplate } from "@/types/email";

// Include "novo_subtipo" in the type guards and unions!
export const validateTemplateType = (type: string): type is 'clients' | 'employees' => {
  return type === 'clients' || type === 'employees';
};

export const validateTemplateSubtype = (
  subtype: string
): subtype is 'recurring' | 'oneTime' | 'invoice' | 'hours' | 'reminder' | 'contract' | 'novo_subtipo' => {
  return [
    'recurring',
    'oneTime',
    'invoice',
    'hours',
    'reminder',
    'contract',
    'novo_subtipo',
  ].includes(subtype);
};

export const validateTemplate = (template: Partial<EmailTemplate>): boolean => {
  if (!template.type || !template.subtype) return false;
  return validateTemplateType(template.type) && validateTemplateSubtype(template.subtype);
};
