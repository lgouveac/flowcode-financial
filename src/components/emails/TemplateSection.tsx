import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, RefreshCwIcon } from "lucide-react";
import { TemplateEditor } from "./TemplateEditor";
import { VariablesList } from "./VariablesList";
import { EmailTemplate, variablesList } from "@/types/email";
import { useToast } from "@/hooks/use-toast";

interface TemplateSectionProps {
  type: 'clients' | 'employees';
  onSaveTemplate: (template: Partial<EmailTemplate>) => Promise<boolean>;
}

export const TemplateSection = ({ type, onSaveTemplate }: TemplateSectionProps) => {
  const { toast } = useToast();
  const [currentType, setCurrentType] = useState(type === 'employees' ? 'invoice' : 'recurring');
  const [draggingVariable, setDraggingVariable] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<EmailTemplate>>({
    type: type,
    subtype: type === 'employees' ? 'invoice' : 'recurring',
    name: '',
    subject: '',
    content: '',
    send_day: type === 'employees' ? 1 : null,
  });

  const handleTypeChange = (type: string) => {
    setCurrentType(type);
    setNewTemplate(prev => ({
      ...prev,
      subtype: type as 'recurring' | 'oneTime' | 'invoice' | 'hours',
    }));
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
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const currentValue = target.value;
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      
      if (targetId === "template-name") {
        setNewTemplate(prev => ({ ...prev, name: newValue }));
      } else if (targetId === "subject") {
        setNewTemplate(prev => ({ ...prev, subject: newValue }));
      } else if (targetId === "content") {
        setNewTemplate(prev => ({ ...prev, content: newValue }));
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
    setNewTemplate(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do template.",
        variant: "destructive",
      });
      return;
    }

    const success = await onSaveTemplate(newTemplate);
    
    if (success) {
      setNewTemplate({
        type: type,
        subtype: currentType as 'recurring' | 'oneTime' | 'invoice' | 'hours',
        name: '',
        subject: '',
        content: '',
        send_day: type === 'employees' ? 1 : null,
      });
    }
  };

  const currentVariables = variablesList[type]?.[currentType as keyof (typeof variablesList.clients | typeof variablesList.employees)] || [];

  return (
    <Tabs defaultValue={type === 'employees' ? 'invoice' : 'recurring'} onValueChange={handleTypeChange}>
      <TabsList className="mb-4">
        {type === 'employees' ? (
          <>
            <TabsTrigger value="invoice">Template NF</TabsTrigger>
            <TabsTrigger value="hours">Template Horas</TabsTrigger>
          </>
        ) : (
          <>
            <TabsTrigger value="recurring" className="flex items-center gap-2">
              <RefreshCwIcon className="h-4 w-4" />
              Cobrança Recorrente
            </TabsTrigger>
            <TabsTrigger value="oneTime" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Cobrança Pontual
            </TabsTrigger>
          </>
        )}
      </TabsList>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <TemplateEditor
            type={type}
            currentType={currentType}
            template={newTemplate}
            onInputChange={handleInputChange}
            onSave={handleSaveTemplate}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            showSendDay={type === 'employees'}
          />
        </div>
        <VariablesList
          variables={currentVariables}
          onDragStart={handleDragStart}
        />
      </div>
    </Tabs>
  );
};
