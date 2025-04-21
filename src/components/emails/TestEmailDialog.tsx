
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/ui/loading-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmailTest } from "./hooks/useEmailTest";
import { TestEmailDialogProps } from "./types/emailTest";
import { EmailPreview } from "./components/EmailPreview";
import { Label } from "../ui/label";

export const TestEmailDialog = ({
  template,
  open,
  onClose,
}: TestEmailDialogProps) => {
  const {
    selectedRecordId,
    setSelectedRecordId,
    records,
    isLoadingRecords,
    isSendingEmail,
    handleTestEmail,
    error,
    previewData
  } = useEmailTest(template);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Testar Template</DialogTitle>
          <DialogDescription>
            Envie um email de teste para verificar como o template será renderizado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Selecione um {template.type === 'clients' ? 'recebimento' : 'funcionário'}</Label>
            <Select
              value={selectedRecordId}
              onValueChange={setSelectedRecordId}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  isLoadingRecords 
                    ? "Carregando..." 
                    : records.length === 0 
                      ? "Nenhum registro disponível" 
                      : `Selecione um ${template.type === 'clients' ? 'recebimento' : 'funcionário'}`
                } />
              </SelectTrigger>
              <SelectContent>
                {records.length === 0 ? (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    Nenhum registro disponível
                  </div>
                ) : (
                  records.map((record) => (
                    <SelectItem key={record.id} value={record.id}>
                      {record.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedRecordId && previewData && (
            <EmailPreview
              selectedTemplate={template.id}
              templates={[template]}
              clientName={previewData?.clientName}
              responsibleName={previewData?.responsibleName}
              amount={previewData?.amount}
              dueDay={previewData?.dueDay}
              dueDate={previewData?.dueDate}
              description={previewData?.description}
              installments={previewData?.totalInstallments}
              currentInstallment={previewData?.currentInstallment}
              paymentMethod={previewData?.paymentMethod as any}
            />
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <LoadingButton
            disabled={!selectedRecordId}
            loading={isSendingEmail}
            onClick={handleTestEmail}
          >
            Enviar Email de Teste
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
