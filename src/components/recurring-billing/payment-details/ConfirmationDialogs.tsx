
import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UseMutateFunction } from "@tanstack/react-query";

interface ConfirmationDialogsProps {
  showUpdateConfirmDialog: boolean;
  showCancelDialog: boolean;
  onCloseUpdateDialog: () => void;
  onCloseCancelDialog: () => void;
  onConfirmUpdate: () => Promise<void>;
  onConfirmCancel: UseMutateFunction<any, Error, void, unknown>;
  isUpdating: boolean;
  isCancelling: boolean;
}

export const ConfirmationDialogs: React.FC<ConfirmationDialogsProps> = ({
  showUpdateConfirmDialog,
  showCancelDialog,
  onCloseUpdateDialog,
  onCloseCancelDialog,
  onConfirmUpdate,
  onConfirmCancel,
  isUpdating,
  isCancelling
}) => {
  return (
    <>
      {/* Confirm Dialog for Updating Payment Dates */}
      <AlertDialog open={showUpdateConfirmDialog} onOpenChange={onCloseUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar datas de pagamentos</AlertDialogTitle>
            <AlertDialogDescription>
              A data de início foi alterada. Deseja atualizar também as datas de vencimento 
              dos pagamentos associados para corresponder à nova data de início?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não atualizar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirmUpdate}
              disabled={isUpdating}
            >
              Atualizar pagamentos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Dialog for Cancelling Billing */}
      <AlertDialog open={showCancelDialog} onOpenChange={onCloseCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar faturamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este faturamento recorrente? 
              Esta ação também cancelará todos os pagamentos pendentes associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onConfirmCancel()}
              disabled={isCancelling}
              className="bg-red-500 hover:bg-red-600"
            >
              Cancelar Faturamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
