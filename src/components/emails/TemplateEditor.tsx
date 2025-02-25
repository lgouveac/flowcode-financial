
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmailTemplate } from "@/types/email";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TemplateEditorProps {
  type: "clients" | "employees";
  currentType: string;
  template: Partial<EmailTemplate>;
  onInputChange: (field: keyof EmailTemplate, value: string | number) => void;
  onSave: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  showSendDay?: boolean;
}

export const TemplateEditor = ({
  template,
  onInputChange,
  onSave,
  onDragOver,
  onDrop,
  showSendDay,
}: TemplateEditorProps) => {
  // Criar array com números de 1 a 28 para os dias do mês
  const daysOfMonth = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="template-name">Nome do Template</Label>
        <Input
          id="template-name"
          value={template.name || ""}
          onChange={(e) => onInputChange("name", e.target.value)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, "template-name")}
          className="w-full"
          placeholder="Ex: Template NF Mensal"
        />
      </div>

      <div>
        <Label htmlFor="subject">Assunto do Email</Label>
        <Input
          id="subject"
          value={template.subject || ""}
          onChange={(e) => onInputChange("subject", e.target.value)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, "subject")}
          className="w-full"
          placeholder="Ex: Nota Fiscal - {mes_referencia}"
        />
      </div>

      {showSendDay && (
        <div>
          <Label htmlFor="send-day">Dia do Envio</Label>
          <Select
            value={String(template.send_day || "1")}
            onValueChange={(value) => onInputChange("send_day", parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o dia do mês" />
            </SelectTrigger>
            <SelectContent>
              {daysOfMonth.map((day) => (
                <SelectItem key={day} value={String(day)}>
                  Dia {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="content">Conteúdo do Email</Label>
        <Textarea
          id="content"
          value={template.content || ""}
          onChange={(e) => onInputChange("content", e.target.value)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, "content")}
          className="min-h-[300px] w-full"
          placeholder="Digite o conteúdo do email aqui..."
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} type="button">
          Salvar Template
        </Button>
      </div>
    </div>
  );
};
