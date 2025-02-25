
import { useState } from "react";
import type { RecurringBilling } from "@/types/billing";

export const useRecurringBillingForm = () => {
  const [formData, setFormData] = useState<Partial<RecurringBilling> & { email_template?: string }>({
    payment_method: 'pix',
    status: 'pending',
    installments: 1
  });

  const updateFormData = (data: Partial<RecurringBilling> & { email_template?: string }) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const validateForm = () => {
    if (!formData.client_id || !formData.description || !formData.amount || 
        !formData.due_day || !formData.start_date || !formData.installments) {
      console.error("Missing required fields:", {
        client_id: !formData.client_id,
        description: !formData.description,
        amount: !formData.amount,
        due_day: !formData.due_day,
        start_date: !formData.start_date,
        installments: !formData.installments
      });
      return false;
    }
    return true;
  };

  return {
    formData,
    updateFormData,
    validateForm
  };
};
