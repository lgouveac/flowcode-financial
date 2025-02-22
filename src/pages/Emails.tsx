
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { MailIcon, GripVertical } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'clients' | 'employees';
  subtype: 'recurring' | 'oneTime' | 'invoice' | 'hours';
}

interface Variable {
  name: string;
  description: string;
}

const variablesList = {
  employees: {
    invoice: [
      { name: "{nome_funcionario}", description: "Nome do funcionário" },
      { name: "{mes_referencia}", description: "Mês de referência" },
      { name: "{valor_nf}", description: "Valor da NF" },
      { name: "{data_limite}", description: "Data limite para envio" },
    ],
    hours: [
      { name: "{nome_funcionario}", description: "Nome do funcionário" },
      { name: "{mes_referencia}", description: "Mês de referência" },
      { name: "{total_horas}", description: "Total de horas" },
      { name: "{data_limite}", description: "Data limite para envio" },
    ],
  },
  clients: {
    recurring: [
      { name: "{nome_cliente}", description: "Nome do cliente" },
      { name: "{valor_cobranca}", description: "Valor da cobrança" },
      { name: "{data_vencimento}", description: "Data de vencimento" },
      { name: "{plano_servico}", description: "Plano/Serviço contratado" },
      { name: "{periodo_referencia}", description: "Período de referência" },
      { name: "{numero_parcela}", description: "Número da parcela atual" },
      { name: "{total_parcelas}", description: "Total de parcelas" },
    ],
    oneTime: [
      { name: "{nome_cliente}", description: "Nome do cliente" },
      { name: "{valor_cobranca}", description: "Valor da cobrança" },
      { name: "{data_vencimento}", description: "Data de vencimento" },
      { name: "{descricao_servico}", description: "Descrição do serviço" },
      { name: "{numero_pedido}", description: "Número do pedido" },
    ],
  },
};

export const Emails = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
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
      
      // Update the form state based on the target field
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
    
    // Reset form
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
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Editor de Template - {currentType === "invoice" ? "Nota Fiscal" : "Horas"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Nome do Template</Label>
                      <Input
                        id="template-name"
                        placeholder="Ex: Template padrão de NF"
                        value={newTemplate.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "template-name")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto</Label>
                      <Input
                        id="subject"
                        placeholder="Ex: Solicitação de Nota Fiscal - {mes_referencia}"
                        value={newTemplate.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "subject")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Conteúdo</Label>
                      <Textarea
                        id="content"
                        className="min-h-[300px]"
                        placeholder={`Ex: Olá {nome_funcionario},\n\nPor favor, envie sua nota fiscal referente ao mês de {mes_referencia}...`}
                        value={newTemplate.content}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "content")}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSaveTemplate}>Salvar Template</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Variáveis Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {variablesList.employees[currentType as keyof typeof variablesList.employees]?.map((variable) => (
                      <div
                        key={variable.name}
                        className="flex items-start space-x-2 p-2 rounded border border-border cursor-move hover:bg-accent"
                        draggable
                        onDragStart={(e) => handleDragStart(e, variable.name)}
                      >
                        <GripVertical className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex flex-col space-y-1">
                          <code className="text-sm font-mono bg-muted p-1 rounded">
                            {variable.name}
                          </code>
                          <span className="text-sm text-muted-foreground">
                            {variable.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Tabs>
        </TabsContent>

        <TabsContent value="clients">
          <Tabs defaultValue="recurring" onValueChange={handleTypeChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="recurring">Cobrança Recorrente</TabsTrigger>
              <TabsTrigger value="oneTime">Cobrança Pontual</TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                      Editor de Template - {currentType === "recurring" ? "Cobrança Recorrente" : "Cobrança Pontual"}
                    </CardTitle>
                    <Button variant="secondary" onClick={handleSaveTemplate}>
                      <MailIcon className="mr-2 h-4 w-4" />
                      Testar E-mail
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Nome do Template</Label>
                      <Input
                        id="template-name"
                        placeholder="Ex: Template de cobrança mensal"
                        value={newTemplate.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "template-name")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto</Label>
                      <Input
                        id="subject"
                        placeholder="Ex: Fatura {numero_pedido} - {descricao_servico}"
                        value={newTemplate.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "subject")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Conteúdo</Label>
                      <Textarea
                        id="content"
                        className="min-h-[300px]"
                        placeholder={`Ex: Prezado {nome_cliente},\n\nSegue a fatura referente ao serviço...`}
                        value={newTemplate.content}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "content")}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSaveTemplate}>Salvar Template</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Variáveis Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {variablesList.clients[currentType as keyof typeof variablesList.clients]?.map((variable) => (
                      <div
                        key={variable.name}
                        className="flex items-start space-x-2 p-2 rounded border border-border cursor-move hover:bg-accent"
                        draggable
                        onDragStart={(e) => handleDragStart(e, variable.name)}
                      >
                        <GripVertical className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex flex-col space-y-1">
                          <code className="text-sm font-mono bg-muted p-1 rounded">
                            {variable.name}
                          </code>
                          <span className="text-sm text-muted-foreground">
                            {variable.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Tabs>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Templates Salvos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="p-4 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Assunto</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Última Modificação</th>
                </tr>
              </thead>
              <tbody>
                {savedTemplates.map((template) => (
                  <tr key={template.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">
                      {template.name}
                    </td>
                    <td className="p-4">
                      {template.type === 'clients' 
                        ? (template.subtype === 'recurring' ? 'Cobrança Recorrente' : 'Cobrança Pontual')
                        : (template.subtype === 'invoice' ? 'Nota Fiscal' : 'Horas')}
                    </td>
                    <td className="p-4">
                      {template.subject}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      Hoje às 15:30
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

