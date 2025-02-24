
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { TemplateEditor } from "./TemplateEditor";
import { EmailTemplate } from "@/types/email";
import { useToast } from "@/components/ui/use-toast";

interface EditTemplateDialogProps {
  template: EmailTemplate;
  open: boolean;
  onClose: () => void;
  onSave: (template: EmailTemplate) => void;
}

export const EditTemplateDialog = ({ template, open, onClose, onSave }: EditTemplateDialogProps) => {
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate>(template);
  const { toast } = useToast();

  const handleInputChange = (field: keyof EmailTemplate, value: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar Template</DialogTitle>
        </DialogHeader>
        <TemplateEditor
          type={template.type}
          currentType={template.subtype}
          template={editedTemplate}
          onInputChange={handleInputChange}
          onSave={handleSave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e, id) => {
            e.preventDefault();
            const variable = e.dataTransfer.getData('text/plain');
            const target = document.getElementById(id) as HTMLTextAreaElement | HTMLInputElement;
            if (target) {
              const start = target.selectionStart || 0;
              const end = target.selectionEnd || 0;
              const currentValue = target.value;
              const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
              handleInputChange(id === "template-name" ? "name" : id === "subject" ? "subject" : "content", newValue);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
