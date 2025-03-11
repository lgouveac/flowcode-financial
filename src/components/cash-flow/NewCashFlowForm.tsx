
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormFields } from "./FormFields";
import { useCashFlowForm } from "@/hooks/useCashFlowForm";
import { PaymentSelector } from "./PaymentSelector";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Payment } from "@/types/payment";

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

  const isPaymentCategory = category === 'payment';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-[425px]">
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
            {isPaymentCategory && payments && (
              <PaymentSelector
                payments={payments}
                selectedPayment={selectedPayment as unknown as Payment | null}
                onSelect={(payment) => {
                  if (payment) {
                    setSelectedPayment(payment.id);
                    setDescription(payment.description);
                    setAmount(payment.amount.toString());
                  }
                }}
              />
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
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
