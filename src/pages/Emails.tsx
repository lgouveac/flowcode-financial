
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCwIcon, CalendarIcon } from "lucide-react";
import { TemplateEditor } from "@/components/emails/TemplateEditor";
import { VariablesList } from "@/components/emails/VariablesList";
import { SavedTemplatesTable } from "@/components/emails/SavedTemplatesTable";
import { EmailTemplate, variablesList } from "@/types/email";
import { supabase } from "@/integrations/supabase/client";

export const Emails = () => {
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState<'employees' | 'clients'>('employees');
  const [currentType, setCurrentType] = useState(currentSection === 'employees' ? 'invoice' : 'recurring');
  const [draggingVariable, setDraggingVariable] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<EmailTemplate>>({
    type: 'clients',
    subtype: 'recurring',
    name: '',
    subject: '',
    content: '',
    send_day: null,
  });
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const validateTemplateType = (type: string): type is 'clients' | 'employees' => {
    return type === 'clients' || type === 'employees';
  };

  const validateTemplateSubtype = (subtype: string): subtype is 'recurring' | 'oneTime' | 'invoice' | 'hours' => {
    return ['recurring', 'oneTime', 'invoice', 'hours'].includes(subtype);
  };

  const fetchTemplates = async () => {
    try {
      const { data: rawData, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validTemplates = (rawData || []).reduce<EmailTemplate[]>((acc, template) => {
        if (validateTemplateType(template.type) && validateTemplateSubtype(template.subtype)) {
          acc.push({
            ...template,
            type: template.type,
            subtype: template.subtype,
            send_day: template.send_day || null,
          });
        }
        return acc;
      }, []);

      setSavedTemplates(validTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Erro ao carregar templates",
        description: "Não foi possível carregar os templates. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleTemplateUpdate = async (updatedTemplate: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          name: updatedTemplate.name,
          subject: updatedTemplate.subject,
          content: updatedTemplate.content,
          send_day: updatedTemplate.send_day,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedTemplate.id);

      if (error) throw error;

      setSavedTemplates(prev => prev.map(template => 
        template.id === updatedTemplate.id ? updatedTemplate : template
      ));

      toast({
        title: "Template atualizado",
        description: "O template foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Erro ao atualizar template",
        description: "Não foi possível atualizar o template. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleTemplateDelete = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setSavedTemplates(prev => prev.filter(template => template.id !== templateId));
      toast({
        title: "Template excluído",
        description: "O template foi excluído com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erro ao excluir template",
        description: "Não foi possível excluir o template. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSectionChange = (section: string) => {
    setCurrentSection(section as 'clients' | 'employees');
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
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: newTemplate.name,
          subject: newTemplate.subject,
          content: newTemplate.content,
          type: newTemplate.type,
          subtype: newTemplate.subtype,
          send_day: newTemplate.type === 'employees' ? newTemplate.send_day : null
        })
        .select()
        .single();

      if (error) throw error;

      if (validateTemplateType(data.type) && validateTemplateSubtype(data.subtype)) {
        setSavedTemplates(prev => [{
          ...data,
          type: data.type as 'clients' | 'employees',
          subtype: data.subtype as 'recurring' | 'oneTime' | 'invoice' | 'hours',
          send_day: data.send_day || null
        }, ...prev]);
      }
      
      setNewTemplate({
        type: currentSection as 'clients' | 'employees',
        subtype: currentType as 'recurring' | 'oneTime' | 'invoice' | 'hours',
        name: '',
        subject: '',
        content: '',
        send_day: 1,
      });

      toast({
        title: "Template Salvo",
        description: "O template de e-mail foi salvo com sucesso.",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro ao salvar template",
        description: "Não foi possível salvar o template. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof EmailTemplate, value: string | number) => {
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
                  showSendDay={true}
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
                  showSendDay={false}
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

      <SavedTemplatesTable 
        templates={savedTemplates} 
        onTemplateUpdate={handleTemplateUpdate}
        onTemplateDelete={handleTemplateDelete}
        isLoading={isLoading}
      />
    </div>
  );
};

