
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Record } from "../types/emailTest";
import { getRecordLabel } from "../utils/recordUtils";
import { EmailTemplate } from "@/types/email";

interface RecordSelectorProps {
  selectedRecordId: string;
  onRecordSelect: (id: string) => void;
  records: Record[];
  isLoading: boolean;
  template: EmailTemplate;
}

export const RecordSelector = ({
  selectedRecordId,
  onRecordSelect,
  records,
  isLoading,
  template,
}: RecordSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Selecione o registro</Label>
      <Select
        value={selectedRecordId}
        onValueChange={onRecordSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder={
            isLoading 
              ? "Carregando..." 
              : template.type === "employees" 
                ? "Selecione um funcionário"
                : template.subtype === "recurring"
                  ? "Selecione uma cobrança recorrente"
                  : "Selecione uma cobrança pontual"
          } />
        </SelectTrigger>
        <SelectContent>
          {records.map((record) => (
            <SelectItem key={record.id} value={record.id}>
              {getRecordLabel(record)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
