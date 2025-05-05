import { Send, FileText, RefreshCw, CalendarCheck, Plus, FileType, Tag, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { TemplateSection } from "@/components/emails/TemplateSection";
import { Button } from "@/components/ui/button";
import { TestEmployeeNotificationButton } from "@/components/emails/TestEmployeeNotificationButton";
import { EmailCCRecipientsManager } from "@/components/emails/EmailCCRecipientsManager";
import { EmailTemplate, EmailTemplateSubtype } from "@/types/email";
import { createTemplate } from "@/services/templateService";
import { useToast } from "@/hooks/use-toast";
import { NewTemplateDialog } from "@/components/emails/NewTemplateDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplateCategoryButton } from "@/components/emails/TemplateCategoryButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface CustomSubtype {
  id: string;
  name: string;
  type: 'clients' | 'employees';
}

export default function Emails() {
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [showCCRecipients, setShowCCRecipients] = useState(false);
  const [currentTemplateType, setCurrentTemplateType] = useState<'clients' | 'employees'>('clients');
  const [currentSubtype, setCurrentSubtype] = useState<EmailTemplateSubtype>(currentTemplateType === 'clients' ? 'recurring' : 'invoice');
  const [newSubtypeDialogOpen, setNewSubtypeDialogOpen] = useState(false);
  const [newSubtypeName, setNewSubtypeName] = useState("");
  const [customSubtypes, setCustomSubtypes] = useState<CustomSubtype[]>([]);
  const { toast } = useToast();

  // Update currentSubtype whenever the template type changes
  useEffect(() => {
    // Set correct default subtype when type changes
    console.log("Template type changed to:", currentTemplateType);
    const defaultSubtype: EmailTemplateSubtype = currentTemplateType === 'clients' ? 'recurring' : 'invoice';
    console.log("Setting default subtype to:", defaultSubtype);
    setCurrentSubtype(defaultSubtype);
  }, [currentTemplateType]);
  
  // Load custom subtypes from localStorage on component mount
  useEffect(() => {
    const savedSubtypes = localStorage.getItem('customEmailSubtypes');
    if (savedSubtypes) {
      try {
        setCustomSubtypes(JSON.parse(savedSubtypes));
      } catch (error) {
        console.error("Error parsing saved subtypes:", error);
      }
    }
  }, []);

  // Save custom subtypes to localStorage whenever they change
  useEffect(() => {
    if (customSubtypes.length > 0) {
      localStorage.setItem('customEmailSubtypes', JSON.stringify(customSubtypes));
    } else {
      localStorage.removeItem('customEmailSubtypes');
    }
  }, [customSubtypes]);
  
  const handleSaveTemplate = async (template: Partial<EmailTemplate>): Promise<boolean> => {
    try {
      console.log("Creating template with data:", template);
      await createTemplate(template);
      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso!"
      });
      return true;
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Erro ao criar template",
        description: `Não foi possível criar o template: ${error.message || "Erro desconhecido"}`,
        variant: "destructive"
      });
      return false;
    }
  };

  // Handle template type change
  const handleTemplateTypeChange = (type: 'clients' | 'employees') => {
    console.log(`Changing template type from ${currentTemplateType} to ${type}`);
    setCurrentTemplateType(type);
  };

  // Handle adding a new subtype
  const handleAddNewSubtype = () => {
    if (!newSubtypeName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o novo subtipo.",
        variant: "destructive"
      });
      return;
    }

    // Create a unique ID for the new subtype
    const newSubtypeId = `custom_${Date.now()}`;
    
    // Add the new subtype to our custom subtypes array
    const newCustomSubtype: CustomSubtype = {
      id: newSubtypeId,
      name: newSubtypeName,
      type: currentTemplateType
    };
    
    setCustomSubtypes(prev => [...prev, newCustomSubtype]);
    
    // Set the current subtype to 'novo_subtipo'
    setCurrentSubtype('novo_subtipo');
    
    // Close the dialog
    setNewSubtypeDialogOpen(false);
    
    // Show success toast
    toast({
      title: "Subtipo adicionado",
      description: `Novo subtipo "${newSubtypeName}" adicionado com sucesso!`
    });
    
    // Reset the name field
    setNewSubtypeName("");
  };

  // Handle deleting a subtype
  const handleDeleteSubtype = (id: string, name: string) => {
    // Filter out the subtype to delete
    setCustomSubtypes(prev => prev.filter(subtype => subtype.id !== id));
    
    // Show success toast
    toast({
      title: "Subtipo removido",
      description: `Subtipo "${name}" removido com sucesso!`
    });
  };

  // Filter custom subtypes by current type
  const filteredCustomSubtypes = customSubtypes.filter(
    subtype => subtype.type === currentTemplateType
  );

  return <div className="space-y-4 px-2 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Emails e Notificações
        </h1>
        <div className="flex flex-row gap-2">
          <Button onClick={() => setNewSubtypeDialogOpen(true)} variant="outline" className="flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Adicionar Subtipo
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Tabs defaultValue="clients" className="w-full" onValueChange={(value: 'clients' | 'employees') => handleTemplateTypeChange(value)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="clients">Templates de Cliente</TabsTrigger>
            <TabsTrigger value="employees">Templates de Funcionário</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clients" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <TemplateCategoryButton icon={RefreshCw} label="Cobrança Recorrente" onClick={() => setCurrentSubtype('recurring')} active={currentSubtype === 'recurring'} />
              <TemplateCategoryButton icon={CalendarCheck} label="Cobrança Pontual" onClick={() => setCurrentSubtype('oneTime')} active={currentSubtype === 'oneTime'} />
              <TemplateCategoryButton icon={FileText} label="Contrato" onClick={() => setCurrentSubtype('contract')} active={currentSubtype === 'contract'} />
              
              {/* Render custom client subtypes */}
              {filteredCustomSubtypes.map(subtype => (
                <div key={subtype.id} className="relative group">
                  <TemplateCategoryButton
                    icon={FileType}
                    label={subtype.name}
                    onClick={() => setCurrentSubtype('novo_subtipo')}
                    active={currentSubtype === 'novo_subtipo'}
                    className="group-hover:pr-12"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubtype(subtype.id, subtype.name);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="employees" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <TemplateCategoryButton icon={FileText} label="Template NF" onClick={() => setCurrentSubtype('invoice')} active={currentSubtype === 'invoice'} />
              <TemplateCategoryButton icon={CalendarCheck} label="Template Horas" onClick={() => setCurrentSubtype('hours')} active={currentSubtype === 'hours'} />
              
              {/* Render custom employee subtypes */}
              {filteredCustomSubtypes.map(subtype => (
                <div key={subtype.id} className="relative group">
                  <TemplateCategoryButton
                    icon={FileType}
                    label={subtype.name}
                    onClick={() => setCurrentSubtype('novo_subtipo')}
                    active={currentSubtype === 'novo_subtipo'}
                    className="group-hover:pr-12"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubtype(subtype.id, subtype.name);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <TemplateSection type={currentTemplateType} subtype={currentSubtype} onSaveTemplate={handleSaveTemplate} />
      </div>

      <NewTemplateDialog open={newTemplateOpen} onClose={() => setNewTemplateOpen(false)} />

      <EmailCCRecipientsManager open={showCCRecipients} onClose={() => setShowCCRecipients(false)} />

      {/* New Subtype Dialog */}
      <Dialog open={newSubtypeDialogOpen} onOpenChange={setNewSubtypeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Subtipo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={newSubtypeName}
                onChange={(e) => setNewSubtypeName(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Onboarding, NDA, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAddNewSubtype}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}
