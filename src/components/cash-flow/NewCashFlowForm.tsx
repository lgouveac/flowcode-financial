
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormFields } from "./FormFields";
import { useCashFlowForm } from "@/hooks/useCashFlowForm";
import { PaymentSelector } from "./PaymentSelector";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Payment } from "@/types/payment";
import { useEffect } from "react";

interface NewCashFlowFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewCashFlowForm = ({ open, onClose, onSuccess }: NewCashFlowFormProps) => {
  const { 
    movementType,
    setMovementType,
    category,
    setCategory,
    description,
    setDescription,
    amount,
    setAmount,
    date,
    setDate,
    selectedPayment,
    setSelectedPayment,
    payments,
    isSubmitting,
    isLoading,
    handleSubmit
  } = useCashFlowForm({ onSuccess, onClose });
  
  // Debug logs
  useEffect(() => {
    console.log("NewCashFlowForm payments:", payments);
    console.log("Selected payment ID:", selectedPayment);
  }, [payments, selectedPayment]);

  const isPaymentCategory = category === 'payment';

  // Safely find the selected payment object from the payments array
  const getSelectedPaymentObject = () => {
    if (!isPaymentCategory || !selectedPayment || !payments) {
      return null;
    }
    return payments.find(p => p.id === selectedPayment) || null;
  };
  
  const selectedPaymentObject = getSelectedPaymentObject();
  
  // Handle payment selection
  const handlePaymentSelect = (payment: Payment | null) => {
    console.log("Payment selected:", payment);
    if (payment) {
      setSelectedPayment(payment.id);
      setDescription(payment.description);
      setAmount(payment.amount.toString());
      // Set date to payment due_date if no date is selected
      if (!date) {
        setDate(payment.due_date);
      }
    } else {
      setSelectedPayment('');
      setDescription('');
      setAmount('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSubmit(e);
        }}>
          <div className="grid gap-4 py-4">
            <FormFields
              movementType={movementType}
              category={category}
              description={description}
              amount={amount}
              date={date}
              onMovementTypeChange={setMovementType}
              onCategoryChange={setCategory}
              onDescriptionChange={setDescription}
              onAmountChange={setAmount}
              onDateChange={setDate}
              isPaymentCategory={isPaymentCategory}
            />
            
            {isPaymentCategory && Array.isArray(payments) && (
              <PaymentSelector
                payments={payments}
                selectedPayment={selectedPaymentObject}
                onSelect={handlePaymentSelect}
              />
            )}
          </div>
          <Button type="submit" disabled={isSubmitting || (isPaymentCategory && !selectedPayment)}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Lançamento"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
