import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormFields } from "./FormFields";
import { useCashFlowForm } from "@/hooks/useCashFlowForm";
import { PaymentSelector } from "./PaymentSelector";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface NewCashFlowFormProps {
  open: boolean;
  onClose: () => void;
}

export const NewCashFlowForm = ({ open, onClose }: NewCashFlowFormProps) => {
  const { 
    payments, 
    selectedPayment, 
    setSelectedPayment,
    description,
    amount,
    paymentDate,
    status,
    paymentMethod,
    setDescription,
    setAmount,
    setPaymentDate,
    setStatus,
    setPaymentMethod,
    isLoading,
    handleSubmit
  } = useCashFlowForm();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSubmit();
        }}>
          <div className="grid gap-4 py-4">
            <PaymentSelector
              payments={payments || []}
              selectedPayment={selectedPayment}
              onSelect={setSelectedPayment}
            />
            <FormFields 
              description={description}
              amount={amount}
              paymentDate={paymentDate}
              status={status}
              paymentMethod={paymentMethod}
              setDescription={setDescription}
              setAmount={setAmount}
              setPaymentDate={setPaymentDate}
              setStatus={setStatus}
              setPaymentMethod={setPaymentMethod}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
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
