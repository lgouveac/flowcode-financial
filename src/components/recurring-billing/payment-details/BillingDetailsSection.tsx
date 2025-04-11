
import React from "react";
import { BillingDetails } from "../BillingDetails";
import { RecurringBilling } from "@/types/billing";
import { UseMutateFunction } from "@tanstack/react-query";

interface BillingDetailsSectionProps {
  billing: any; // Use 'billing' as the prop name to match usage in PaymentDetailsDialog
  onUpdate: UseMutateFunction<any, Error, any, unknown>;
  onCancel: () => void;
  onStartDateChange: (date: string) => void;
}

export const BillingDetailsSection: React.FC<BillingDetailsSectionProps> = ({
  billing, // Updated parameter name to match the interface
  onUpdate,
  onCancel,
  onStartDateChange
}) => {
  const handleFieldUpdate = (field: string, value: string | number) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <BillingDetails 
        billingData={billing}
        onUpdate={handleFieldUpdate}
        darkMode={true}
      />
      
      <div className="flex justify-between mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Cancelar Faturamento
        </button>
        
        {billing?.start_date && (
          <div>
            <label className="block text-sm font-medium mb-1">Data de Início</label>
            <input
              type="date"
              value={billing.start_date}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="p-2 border rounded-md"
            />
          </div>
        )}
      </div>
    </div>
  );
}
