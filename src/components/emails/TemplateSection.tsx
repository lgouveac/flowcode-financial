
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate, EmailTemplateSubtype, variablesList } from "@/types/email";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { TemplateEditor } from "./TemplateEditor";
import { VariablesList } from "./VariablesList";
import { SavedTemplatesTable } from "./SavedTemplatesTable";
import { TestEmailDialog } from "./TestEmailDialog";

interface TemplateSectionProps {
  type: 'clients' | 'employees';
  subtype: EmailTemplateSubtype;
  onSaveTemplate: (template: Partial<EmailTemplate>) => Promise<boolean>;
}

export const TemplateSection = ({
  type,
  subtype,
  onSaveTemplate
}: TemplateSectionProps) => {
  const { toast } = useToast();
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [draggingVariable, setDraggingVariable] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<EmailTemplate>>({
    type: type,
    subtype: subtype,
    name: '',
    subject: '',
    content: ''
  });
  
  // Update template when parent props change
  useEffect(() => {
    console.log(`Props changed - type: ${type}, subtype: ${subtype}`);
    setNewTemplate(prev => ({
      ...prev,
      type: type,
      subtype: subtype,
      name: '',
      subject: '',
      content: ''
    }));
  }, [type, subtype]);
  
  const {
    savedTemplates,
    isLoading,
    handleTemplateUpdate
  } = useEmailTemplates();

  // Filter templates by current type AND subtype
  const currentTemplates = savedTemplates.filter(template => 
    template.type === type && template.subtype === subtype
  );

  const handleDragStart = (e: React.DragEvent, variable: string) => {
    setDraggingVariable(variable);
    e.dataTransfer.setData('text/plain', variable);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const variable = e.dataTransfer.getData('text/plain');
    const target = document.getElementById(targetId) as HTMLTextAreaElement | HTMLInputElement;
    if (target) {
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const currentValue = target.value;
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      if (targetId === "template-name") {
        setNewTemplate(prev => ({
          ...prev,
          name: newValue
        }));
      } else if (targetId === "subject") {
        setNewTemplate(prev => ({
          ...prev,
          subject: newValue
        }));
      } else if (targetId === "content") {
        setNewTemplate(prev => ({
          ...prev,
          content: newValue
        }));
      }
      target.value = newValue;
      target.focus();
      target.setSelectionRange(start + variable.length, start + variable.length);
    }
    setDraggingVariable(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (field: keyof EmailTemplate, value: string | number) => {
    setNewTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do template.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("Saving template:", {
        ...newTemplate,
        type: type,
        subtype: subtype
      });

      const templateToSave = {
        ...newTemplate,
        type: type,
        subtype: subtype
      };

      const success = await onSaveTemplate(templateToSave);

      if (success) {
        toast({
          title: "Template salvo",
          description: "O template foi salvo com sucesso!"
        });

        // Clear the form but maintain the current subtype
        setNewTemplate({
          type: type,
          subtype: subtype,
          name: '',
          subject: '',
          content: ''
        });
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Erro ao salvar template",
        description: "Ocorreu um erro ao salvar o template. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Get variables for the current type and subtype
  const currentVariables = variablesList[type]?.[subtype] || [];
  console.log(`Variables for ${type}.${subtype}:`, currentVariables);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <TemplateEditor 
          type={type} 
          currentType={subtype} 
          template={newTemplate} 
          onInputChange={handleInputChange} 
          onSave={handleSaveTemplate} 
          onDragOver={handleDragOver} 
          onDrop={handleDrop}
        />

        <SavedTemplatesTable 
          templates={currentTemplates} 
          onTemplateUpdate={handleTemplateUpdate} 
          isLoading={isLoading} 
        />
      </div>
      <div className="order-first lg:order-last mb-6 lg:mb-0">
        <VariablesList 
          variables={currentVariables} 
          onDragStart={handleDragStart} 
        />
      </div>

      <TestEmailDialog 
        template={newTemplate as EmailTemplate} 
        open={testEmailOpen} 
        onClose={() => setTestEmailOpen(false)} 
      />
    </div>
  );
};
