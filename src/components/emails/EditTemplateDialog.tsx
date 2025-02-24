
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { TemplateEditor } from "./TemplateEditor";
import { EmailTemplate, variablesList } from "@/types/email";
import { useToast } from "@/components/ui/use-toast";
import { VariablesList } from "./VariablesList";

interface EditTemplateDialogProps {
  template: EmailTemplate;
  open: boolean;
  onClose: () => void;
  onSave: (template: EmailTemplate) => void;
  showSendDay?: boolean;
}

export const EditTemplateDialog = ({ template, open, onClose, onSave, showSendDay }: EditTemplateDialogProps) => {
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate>(template);
  const { toast } = useToast();
  const [draggingVariable, setDraggingVariable] = useState<string | null>(null);

  const handleInputChange = (field: keyof EmailTemplate, value: string | number) => {
    setEditedTemplate(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!editedTemplate.name || !editedTemplate.subject || !editedTemplate.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do template.",
        variant: "destructive",
      });
      return;
    }

    onSave(editedTemplate);
    onClose();
  };

  const handleDragStart = (e: React.DragEvent, variable: string) => {
    setDraggingVariable(variable);
    e.dataTransfer.setData('text/plain', variable);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const variable = e.dataTransfer.getData('text/plain');
    const target = document.getElementById(targetId) as HTMLTextAreaElement | HTMLInputElement;
    
    if (target) {
      const start = target.selectionStart || target.value.length;
      const end = target.selectionEnd || target.value.length;
      const currentValue = target.value;
      
      // Preparar o novo valor mantendo o texto existente e adicionando a variável na posição correta
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      
      // Atualizar o campo com o novo valor
      const fieldToUpdate = targetId === "template-name" 
        ? "name" 
        : targetId === "subject" 
          ? "subject" 
          : "content";
      
      handleInputChange(fieldToUpdate, newValue);
      
      // Garantir que o foco seja mantido e o cursor seja posicionado após a variável inserida
      requestAnimationFrame(() => {
        target.focus();
        const newPosition = start + variable.length;
        target.setSelectionRange(newPosition, newPosition);
      });
    }
    setDraggingVariable(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const currentVariables = variablesList[template.type]?.[template.subtype as keyof (typeof variablesList.clients | typeof variablesList.employees)] || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar Template</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <TemplateEditor
              type={template.type}
              currentType={template.subtype}
              template={editedTemplate}
              onInputChange={handleInputChange}
              onSave={handleSave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              showSendDay={showSendDay}
            />
          </div>
          <VariablesList
            variables={currentVariables}
            onDragStart={handleDragStart}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
