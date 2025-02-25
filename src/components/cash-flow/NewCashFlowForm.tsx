
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PaymentSelector } from "./PaymentSelector";
import { FormFields } from "./FormFields";
import { useCashFlowForm } from "@/hooks/useCashFlowForm";

interface NewCashFlowFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const NewCashFlowForm = ({ onSuccess, onClose }: NewCashFlowFormProps) => {
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
    handleSubmit,
  } = useCashFlowForm({ onSuccess, onClose });

  const handlePaymentSelect = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setSelectedPayment(paymentId);
      setAmount(payment.amount.toString());
      setDescription(payment.description);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova Movimentação</DialogTitle>
        <DialogDescription>
          Adicione uma nova movimentação ao fluxo de caixa
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
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
          isPaymentCategory={category === 'payment'}
        />

        {category === 'payment' && (
          <div className="space-y-2.5">
            <PaymentSelector
              payments={payments}
              selectedPayment={selectedPayment}
              onSelect={handlePaymentSelect}
            />
          </div>
        )}

        <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Adicionar Movimentação"}
        </Button>
      </form>
    </DialogContent>
  );
};
