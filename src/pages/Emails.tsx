
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCwIcon, CalendarIcon } from "lucide-react";
import { TemplateEditor } from "@/components/emails/TemplateEditor";
import { VariablesList } from "@/components/emails/VariablesList";
import { SavedTemplatesTable } from "@/components/emails/SavedTemplatesTable";
import { EmailTemplate, variablesList } from "@/types/email";

export const Emails = () => {
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState("employees");
  const [currentType, setCurrentType] = useState(currentSection === "employees" ? "invoice" : "recurring");
  const [draggingVariable, setDraggingVariable] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<EmailTemplate>>({
    type: 'clients',
    subtype: 'recurring',
    name: '',
    subject: '',
    content: '',
  });
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([
    {
      id: "1",
      name: "Template NF Mensal",
      subject: "Solicitação de Nota Fiscal - {mes_referencia}",
      content: "Olá {nome_funcionario},\n\nPor favor, envie sua nota fiscal referente ao mês de {mes_referencia}...",
      type: 'employees',
      subtype: 'invoice',
    },
    {
      id: "2",
      name: "Template Cobrança Recorrente",
      subject: "Fatura {periodo_referencia} - {plano_servico} ({numero_parcela}/{total_parcelas})",
      content: "Prezado {nome_cliente},\n\nSegue a fatura referente ao período {periodo_referencia}...",
      type: 'clients',
      subtype: 'recurring',
    }
  ]);

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    setCurrentType(section === "employees" ? "invoice" : "recurring");
    setNewTemplate(prev => ({
      ...prev,
      type: section as 'clients' | 'employees',
      subtype: section === "employees" ? "invoice" : "recurring",
    }));
  };

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

  const handleSaveTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do template.",
        variant: "destructive",
      });
      return;
    }

    const templateToSave: EmailTemplate = {
      id: String(savedTemplates.length + 1),
      name: newTemplate.name,
      subject: newTemplate.subject,
      content: newTemplate.content,
      type: newTemplate.type as 'clients' | 'employees',
      subtype: newTemplate.subtype as 'recurring' | 'oneTime' | 'invoice' | 'hours',
    };

    setSavedTemplates(prev => [...prev, templateToSave]);
    
    setNewTemplate({
      type: currentSection as 'clients' | 'employees',
      subtype: currentType as 'recurring' | 'oneTime' | 'invoice' | 'hours',
      name: '',
      subject: '',
      content: '',
    });

    toast({
      title: "Template Salvo",
      description: "O template de e-mail foi salvo com sucesso.",
    });
  };

  const handleInputChange = (field: keyof EmailTemplate, value: string) => {
    setNewTemplate(prev => ({ ...prev, [field]: value }));
  };

  const currentVariables = variablesList[currentSection as keyof typeof variablesList]?.[currentType as keyof (typeof variablesList.clients | typeof variablesList.employees)] || [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="employees" className="w-full" onValueChange={handleSectionChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Tabs defaultValue="invoice" onValueChange={handleTypeChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="invoice">Template NF</TabsTrigger>
              <TabsTrigger value="hours">Template Horas</TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <TemplateEditor
                  type="employees"
                  currentType={currentType}
                  template={newTemplate}
                  onInputChange={handleInputChange}
                  onSave={handleSaveTemplate}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              </div>
              <VariablesList
                variables={currentVariables}
                onDragStart={handleDragStart}
              />
            </div>
          </Tabs>
        </TabsContent>

        <TabsContent value="clients">
          <Tabs defaultValue="recurring" onValueChange={handleTypeChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="recurring" className="flex items-center gap-2">
                <RefreshCwIcon className="h-4 w-4" />
                Cobrança Recorrente
              </TabsTrigger>
              <TabsTrigger value="oneTime" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Cobrança Pontual
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <TemplateEditor
                  type="clients"
                  currentType={currentType}
                  template={newTemplate}
                  onInputChange={handleInputChange}
                  onSave={handleSaveTemplate}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              </div>
              <VariablesList
                variables={currentVariables}
                onDragStart={handleDragStart}
              />
            </div>
          </Tabs>
        </TabsContent>
      </Tabs>

      <SavedTemplatesTable templates={savedTemplates} />
    </div>
  );
};
