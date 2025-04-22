
import * as React from "react";
import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";

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

  // Busca local
  const [search, setSearch] = useState("");
  const filteredRecords = useMemo(() => {
    if (!search) return records;
    return records.filter(r =>
      r.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  // Ao alterar o search, se o registro selecionado não existir mais no filtro, limpa seleção
  React.useEffect(() => {
    if (selectedRecordId && !filteredRecords.some(r => r.id === selectedRecordId)) {
      setSelectedRecordId("");
    }
  }, [search, filteredRecords, selectedRecordId, setSelectedRecordId]);

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
            <Input
              className="mb-2"
              placeholder={`Buscar ${template.type === 'clients' ? 'recebimento' : 'funcionário'}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Select
              value={selectedRecordId}
              onValueChange={setSelectedRecordId}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  isLoadingRecords 
                    ? "Carregando..." 
                    : filteredRecords.length === 0 
                      ? "Nenhum registro disponível" 
                      : `Selecione um ${template.type === 'clients' ? 'recebimento' : 'funcionário'}`
                } />
              </SelectTrigger>
              <SelectContent>
                {filteredRecords.length === 0 ? (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    Nenhum registro disponível
                  </div>
                ) : (
                  filteredRecords.map((record) => (
                    <SelectItem key={record.id} value={record.id}>
                      {record.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* PreviewData só aparece se houver registro selecionado E (dados de preview já carregados) */}
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
              // Passar o cliente completo para as variáveis
              client={previewData?.client}
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
