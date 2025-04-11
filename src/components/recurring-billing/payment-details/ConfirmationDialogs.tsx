
import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ConfirmationDialogsProps {
  showMarkAsPaidConfirm: boolean;
  setShowMarkAsPaidConfirm: (show: boolean) => void;
  handleMarkBillingAsPaid: () => Promise<void>;
  paymentToUpdate: string | null;
  setPaymentToUpdate: (id: string | null) => void;
  handleMarkPaymentAsPaid: (id: string) => Promise<void>;
  showUpdatePaymentsConfirm: boolean;
  setShowUpdatePaymentsConfirm: (show: boolean) => void;
  updatePaymentDates: () => Promise<void>;
  fetchBillingDetails: () => Promise<void>;
}

export const ConfirmationDialogs: React.FC<ConfirmationDialogsProps> = ({
  showMarkAsPaidConfirm,
  setShowMarkAsPaidConfirm,
  handleMarkBillingAsPaid,
  paymentToUpdate,
  setPaymentToUpdate,
  handleMarkPaymentAsPaid,
  showUpdatePaymentsConfirm,
  setShowUpdatePaymentsConfirm,
  updatePaymentDates,
  fetchBillingDetails
}) => {
  return (
    <>
      {/* Confirm Dialog for Marking Billing as Paid */}
      <AlertDialog open={showMarkAsPaidConfirm} onOpenChange={setShowMarkAsPaidConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar este recebimento como pago? 
              Esta ação também registrará o pagamento no fluxo de caixa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkBillingAsPaid}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Dialog for Marking Payment as Paid */}
      <AlertDialog 
        open={!!paymentToUpdate} 
        onOpenChange={(open) => !open && setPaymentToUpdate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar este pagamento como pago? 
              Esta ação também registrará o pagamento no fluxo de caixa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => paymentToUpdate && handleMarkPaymentAsPaid(paymentToUpdate)}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* New Confirm Dialog for Updating Payment Dates */}
      <AlertDialog open={showUpdatePaymentsConfirm} onOpenChange={setShowUpdatePaymentsConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar datas de pagamentos</AlertDialogTitle>
            <AlertDialogDescription>
              A data de início foi alterada. Deseja atualizar também as datas de vencimento 
              dos pagamentos associados para corresponder à nova data de início?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUpdatePaymentsConfirm(false);
              fetchBillingDetails();
            }}>
              Não atualizar
            </AlertDialogCancel>
            <AlertDialogAction onClick={updatePaymentDates}>
              Atualizar pagamentos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
