
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RecordSelector } from "./components/RecordSelector";
import { useEmailTest } from "./hooks/useEmailTest";
import type { TestEmailDialogProps } from "./types/emailTest";

export const TestEmailDialog = ({ template, open, onClose }: TestEmailDialogProps) => {
  const {
    selectedRecordId,
    setSelectedRecordId,
    records,
    isLoading,
    handleTestEmail,
  } = useEmailTest(template);

  const onSendTest = async () => {
    const success = await handleTestEmail();
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Email de Teste</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RecordSelector
            selectedRecordId={selectedRecordId}
            onRecordSelect={setSelectedRecordId}
            records={records}
            isLoading={isLoading}
            template={template}
          />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onSendTest}>
              Enviar Teste
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
