
import type { EmailTemplate } from "@/types/email";

export interface TestEmailDialogProps {
  template: EmailTemplate;
  open: boolean;
  onClose: () => void;
}

export interface RecurringBilling {
  id: string;
  amount: number;
  description: string;
  due_day: number;
  installments: number;
  current_installment: number;
  payment_method: string;
  client: {
    name: string;
    email: string;
    partner_name?: string;
  };
}

export interface Payment {
  id: string;
  amount: number;
  description: string;
  due_date: string;
  payment_method: string;
  client: {
    name: string;
    email?: string;
    partner_name?: string;
  };
}

export type Employee = {
  id: string;
  name: string;
  email: string;
};

export type Record = RecurringBilling | Payment | Employee;

export type EmailData = {
  to: string;
  subject: string;
  content: string;
  [key: string]: any;
};
