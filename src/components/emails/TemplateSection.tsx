
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, RefreshCwIcon, Send } from "lucide-react";
import { TemplateEditor } from "./TemplateEditor";
import { VariablesList } from "./VariablesList";
import { EmailTemplate, variablesList } from "@/types/email";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TestEmailDialog } from "./TestEmailDialog";
import { SavedTemplatesTable } from "./SavedTemplatesTable";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";

interface TemplateSectionProps {
  type: 'clients' | 'employees';
  onSaveTemplate: (template: Partial<EmailTemplate>) => Promise<boolean>;
}

export const TemplateSection = ({ type, onSaveTemplate }: TemplateSectionProps) => {
  const { toast } = useToast();
  const [currentType, setCurrentType] = useState(type === 'employees' ? 'invoice' : 'recurring');
  const [draggingVariable, setDraggingVariable] = useState<string | null>(null);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<EmailTemplate>>({
    type: type,
    subtype: type === 'employees' ? 'invoice' : 'recurring',
    name: '',
    subject: '',
    content: '',
  });

  const { savedTemplates, isLoading, handleTemplateUpdate } = useEmailTemplates();

  // Filter templates based on current type/subtype
  const currentTemplates = savedTemplates.filter(
    template => template.type === type && template.subtype === currentType
  );

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

    try {
      // Log template being saved
      console.log("Saving template:", { ...newTemplate, subtype: currentType });
      
      const templateToSave = {
        ...newTemplate,
        subtype: currentType as 'recurring' | 'oneTime' | 'invoice' | 'hours'
      };
      
      const success = await onSaveTemplate(templateToSave);
      
      if (success) {
        toast({
          title: "Template salvo",
          description: "O template foi salvo com sucesso!",
        });
        
        setNewTemplate({
          type: type,
          subtype: currentType as 'recurring' | 'oneTime' | 'invoice' | 'hours',
          name: '',
          subject: '',
          content: '',
        });
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Erro ao salvar template",
        description: "Ocorreu um erro ao salvar o template. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const currentVariables = variablesList[type]?.[currentType as keyof (typeof variablesList.clients | typeof variablesList.employees)] || [];

  return (
    <>
      <Tabs defaultValue={type === 'employees' ? 'invoice' : 'recurring'} onValueChange={handleTypeChange}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <TabsList className="w-full sm:w-auto">
            {type === 'employees' ? (
              <>
                <TabsTrigger value="invoice">Template NF</TabsTrigger>
                <TabsTrigger value="hours">Template Horas</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="recurring" className="flex items-center gap-2">
                  <RefreshCwIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Cobrança Recorrente</span>
                  <span className="sm:hidden">Recorrente</span>
                </TabsTrigger>
                <TabsTrigger value="oneTime" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Cobrança Pontual</span>
                  <span className="sm:hidden">Pontual</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setTestEmailOpen(true)}
            disabled={!newTemplate.subject || !newTemplate.content}
          >
            <Send className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Testar Template</span>
            <span className="sm:hidden">Testar</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <TemplateEditor
              type={type}
              currentType={currentType}
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
          <div className="col-span-1 order-first lg:order-last mb-6 lg:mb-0">
            <VariablesList
              variables={currentVariables}
              onDragStart={handleDragStart}
            />
          </div>
        </div>
      </Tabs>

      <TestEmailDialog
        template={newTemplate as EmailTemplate}
        open={testEmailOpen}
        onClose={() => setTestEmailOpen(false)}
      />
    </>
  );
};
