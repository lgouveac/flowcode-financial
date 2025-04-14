
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecordSelector } from "./components/RecordSelector";
import { RecipientField } from "./components/RecipientField";
import { useEmailTest } from "./hooks/useEmailTest";
import { TestEmailDialogProps } from "./types/emailTest";
import { EmailPreview } from "./components/EmailPreview";
import { useState } from "react";

export const TestEmailDialog = ({
  template,
  open,
  onClose,
}: TestEmailDialogProps) => {
  const {
    customEmail,
    setCustomEmail,
    selectedRecord,
    selectedRecordId,
    setSelectedRecordId,
    previewData,
    records,
    isLoadingRecords,
    isSendingEmail,
    handleRecordSelect,
    handleTestEmail,
    recordType,
    setRecordType,
    error,
  } = useEmailTest(template);

  const [mode, setMode] = useState<"record" | "custom">("record");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Testar Template</DialogTitle>
          <DialogDescription>
            Envie um email de teste para verificar como o template será renderizado.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as "record" | "custom")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="record">Selecionar Registro</TabsTrigger>
            <TabsTrigger value="custom">Email Personalizado</TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="space-y-4 py-4">
            <RecordSelector
              selectedRecordId={selectedRecordId}
              onRecordSelect={handleRecordSelect}
              records={records}
              isLoading={isLoadingRecords}
              template={template}
              recordType={recordType}
              onRecordTypeChange={setRecordType}
            />

            {selectedRecordId && (
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
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 py-4">
            <RecipientField
              customEmail={customEmail}
              setCustomEmail={setCustomEmail}
            />

            <EmailPreview
              selectedTemplate={template.id}
              templates={[template]}
              clientName="Cliente Teste"
              responsibleName="Responsável Teste"
              amount={100}
              dueDay={15}
              description="Teste de template"
              installments={1}
              currentInstallment={1}
              paymentMethod="pix"
            />
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <LoadingButton
            disabled={
              (mode === "record" && !selectedRecordId) ||
              (mode === "custom" && !customEmail)
            }
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
