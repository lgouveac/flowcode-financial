
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmailTemplate, EmailTemplateSubtype } from "@/types/email";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TemplateEditorProps {
  type: "clients" | "employees";
  currentType: string;
  template: Partial<EmailTemplate>;
  onInputChange: (field: keyof EmailTemplate, value: string | number) => void;
  onSave: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onTypeChange?: (newType: string) => void;
}

export const TemplateEditor = ({
  type,
  currentType,
  template,
  onInputChange,
  onSave,
  onDragOver,
  onDrop,
  onTypeChange,
}: TemplateEditorProps) => {
  // Debug logs to help identify issues
  console.log("TemplateEditor props:", { type, currentType, template });
  
  return (
    <div className="space-y-4 w-full max-w-full">
      {onTypeChange && (
        <div>
          <Label htmlFor="template-subtype" className="text-sm sm:text-base">Tipo de Template</Label>
          <Select
            value={currentType}
            onValueChange={(value) => {
              console.log("Changing template subtype to:", value);
              onTypeChange(value);
            }}
          >
            <SelectTrigger id="template-subtype" className="w-full mt-1">
              <SelectValue placeholder="Selecione o tipo de template" />
            </SelectTrigger>
            <SelectContent>
              {type === 'clients' ? (
                <>
                  <SelectItem value="recurring">Cobrança Recorrente</SelectItem>
                  <SelectItem value="oneTime">Cobrança Pontual</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="novo_subtipo">Novo Subtipo</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="invoice">Template NF</SelectItem>
                  <SelectItem value="hours">Template Horas</SelectItem>
                  <SelectItem value="novo_subtipo">Novo Subtipo</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="template-name" className="text-sm sm:text-base">Nome do Template</Label>
        <Input
          id="template-name"
          value={template.name || ""}
          onChange={(e) => onInputChange("name", e.target.value)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, "template-name")}
          className="w-full mt-1"
          placeholder="Ex: Template NF Mensal"
        />
      </div>

      <div>
        <Label htmlFor="subject" className="text-sm sm:text-base">Assunto do Email</Label>
        <Input
          id="subject"
          value={template.subject || ""}
          onChange={(e) => onInputChange("subject", e.target.value)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, "subject")}
          className="w-full mt-1"
          placeholder="Ex: Nota Fiscal - {mes_referencia}"
        />
      </div>

      <div>
        <Label htmlFor="content" className="text-sm sm:text-base">Conteúdo do Email</Label>
        <Textarea
          id="content"
          value={template.content || ""}
          onChange={(e) => onInputChange("content", e.target.value)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, "content")}
          className="min-h-[200px] sm:min-h-[300px] w-full mt-1"
          placeholder="Digite o conteúdo do email aqui..."
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} type="button" className="w-full sm:w-auto">
          Salvar Template
        </Button>
      </div>
    </div>
  );
};
