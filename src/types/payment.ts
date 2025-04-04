
export interface Payment {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  payment_method: 'pix' | 'boleto' | 'credit_card';
  status: 'pending' | 'billed' | 'awaiting_invoice' | 'paid' | 'overdue' | 'cancelled' | 'partially_paid';
  created_at?: string;
  updated_at?: string;
  installment_number?: number;
  total_installments?: number;
  email_template?: string;
  paid_amount?: number;
  clients?: {
    name: string;
    email?: string;
    partner_name?: string;
  };
}

export type NewPayment = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;

export type EditablePaymentFields = Pick<Payment, 'description' | 'amount' | 'due_date' | 'payment_date' | 'payment_method' | 'status'>;
