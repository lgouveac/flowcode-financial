
export type EmailTemplateType = 'clients' | 'employees';
export type EmailTemplateSubtype = 'recurring' | 'oneTime' | 'invoice' | 'hours';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: EmailTemplateType;
  subtype: EmailTemplateSubtype;
  created_at: string;
  updated_at: string;
  is_default?: boolean;
}
