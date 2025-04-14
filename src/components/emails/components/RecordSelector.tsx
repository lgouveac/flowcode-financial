
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Record, RecordType } from "../types/emailTest";
import { getRecordLabel } from "../utils/recordUtils";
import { EmailTemplate } from "@/types/email";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListFilter } from "lucide-react";
import { useEffect } from "react";

interface RecordSelectorProps {
  selectedRecordId: string;
  onRecordSelect: (id: string) => void;
  records: Record[];
  isLoading: boolean;
  template: EmailTemplate;
  recordType: RecordType;
  onRecordTypeChange: (type: RecordType) => void;
}

export const RecordSelector = ({
  selectedRecordId,
  onRecordSelect,
  records,
  isLoading,
  template,
  recordType,
  onRecordTypeChange,
}: RecordSelectorProps) => {
  // Only show type filter for client templates
  const showTypeFilter = template.type === "clients";

  // Clear selection when records change
  useEffect(() => {
    if (selectedRecordId && !records.some(r => r.id === selectedRecordId)) {
      onRecordSelect("");
    }
  }, [records, selectedRecordId, onRecordSelect]);

  const getPlaceholder = () => {
    if (isLoading) return "Carregando...";
    
    if (template.type === "employees") 
      return "Selecione um funcionário";
    
    if (recordType === "recurring") 
      return "Selecione uma cobrança recorrente";
    
    if (recordType === "oneTime") 
      return "Selecione uma cobrança pontual";
    
    return "Selecione um registro";
  };

  return (
    <div className="space-y-4">
      {showTypeFilter && (
        <div className="space-y-2">
          <div className="flex items-center">
            <ListFilter className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label>Filtrar por tipo</Label>
          </div>
          <Tabs value={recordType} onValueChange={(value) => onRecordTypeChange(value as RecordType)} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
              <TabsTrigger value="oneTime">Pontuais</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="space-y-2">
        <Label>Selecione o registro</Label>
        <Select
          value={selectedRecordId}
          onValueChange={onRecordSelect}
        >
          <SelectTrigger>
            <SelectValue placeholder={getPlaceholder()} />
          </SelectTrigger>
          <SelectContent>
            {records.length === 0 ? (
              <div className="py-2 px-2 text-sm text-muted-foreground">
                Nenhum registro disponível para este filtro
              </div>
            ) : (
              records.map((record) => (
                <SelectItem key={record.id} value={record.id}>
                  {getRecordLabel(record)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
