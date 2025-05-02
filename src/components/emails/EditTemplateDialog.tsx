
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { TemplateEditor } from "./TemplateEditor";
import { EmailTemplate, variablesList } from "@/types/email";
import { useToast } from "@/components/ui/use-toast";
import { VariablesList } from "./VariablesList";
import { TestEmailDialog } from "./TestEmailDialog";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface EditTemplateDialogProps {
  template: EmailTemplate;
  open: boolean;
  onClose: () => void;
  onSave: (template: EmailTemplate) => void;
}

export const EditTemplateDialog = ({ template, open, onClose, onSave }: EditTemplateDialogProps) => {
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate>(template);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
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
    if (!draggingVariable) return;

    const target = document.getElementById(targetId) as HTMLTextAreaElement | HTMLInputElement;
    if (!target) return;

    const start = target.selectionStart || target.value.length;
    const end = target.selectionEnd || target.value.length;

    const fieldToUpdate = targetId === "template-name" 
      ? "name" 
      : targetId === "subject" 
        ? "subject" 
        : "content";

    const currentValue = editedTemplate[fieldToUpdate] as string;
    const newValue = currentValue.substring(0, start) + draggingVariable + currentValue.substring(end);

    handleInputChange(fieldToUpdate as keyof EmailTemplate, newValue);

    requestAnimationFrame(() => {
      target.focus();
      const newPosition = start + draggingVariable.length;
      target.setSelectionRange(newPosition, newPosition);
    });

    setDraggingVariable(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Fix: Properly get variables for the current template type and subtype
  let currentVariables = [];
  
  // Add debug logs
  console.log("Template in EditTemplateDialog:", template);
  
  if (template.type === 'employees') {
    // Get employee variables for this subtype
    currentVariables = variablesList.employees[template.subtype] || [];
    console.log("Employee variables found in dialog:", currentVariables);
  } else {
    // Get client variables for this subtype
    currentVariables = variablesList.clients[template.subtype] || [];
    console.log("Client variables found in dialog:", currentVariables);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Editar Template</DialogTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTestEmailOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Testar Template
            </Button>
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
              />
            </div>
            <VariablesList
              variables={currentVariables}
              onDragStart={handleDragStart}
            />
          </div>
        </DialogContent>
      </Dialog>

      <TestEmailDialog 
        template={editedTemplate}
        open={testEmailOpen}
        onClose={() => setTestEmailOpen(false)}
      />
    </>
  );
};
