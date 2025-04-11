
import React from "react";
import { BillingDetails } from "../BillingDetails";
import { RecurringBilling } from "@/types/billing";

interface BillingDetailsSectionProps {
  billingData: any;
  editedBillingData: Partial<RecurringBilling>;
  isEditing: boolean;
  updateBillingField: (field: string, value: string | number) => void;
}

export const BillingDetailsSection: React.FC<BillingDetailsSectionProps> = ({
  billingData,
  editedBillingData,
  isEditing,
  updateBillingField
}) => {
  return (
    <BillingDetails 
      billingData={isEditing ? null : billingData}
      description={isEditing ? editedBillingData.description : undefined}
      amount={isEditing ? editedBillingData.amount : undefined}
      installments={isEditing ? editedBillingData.installments : undefined}
      dueDay={isEditing ? editedBillingData.due_day : undefined}
      startDate={isEditing ? editedBillingData.start_date : undefined}
      endDate={isEditing ? editedBillingData.end_date : undefined}
      onUpdate={isEditing ? updateBillingField : undefined}
      darkMode={true}
    />
  );
};
