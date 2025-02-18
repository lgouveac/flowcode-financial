
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

const variablesList = {
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
  billing: [
    { name: "{nome_cliente}", description: "Nome do cliente" },
    { name: "{valor_cobranca}", description: "Valor da cobrança" },
    { name: "{data_vencimento}", description: "Data de vencimento" },
    { name: "{descricao_servico}", description: "Descrição do serviço" },
  ],
};

export const Emails = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [currentTab, setCurrentTab] = useState("invoice");

  const handleSaveTemplate = () => {
    toast({
      title: "Template Salvo",
      description: "O template de e-mail foi salvo com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="invoice" className="w-full" onValueChange={setCurrentTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="invoice">E-mail NF</TabsTrigger>
          <TabsTrigger value="hours">E-mail Horas</TabsTrigger>
          <TabsTrigger value="billing">E-mail Cobrança</TabsTrigger>
        </TabsList>

        {["invoice", "hours", "billing"].map((type) => (
          <TabsContent key={type} value={type}>
            <div className="grid grid-cols-3 gap-6">
              {/* Editor */}
              <div className="col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Editor de Template - {type === "invoice" ? "Nota Fiscal" : type === "hours" ? "Horas" : "Cobrança"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Nome do Template</Label>
                      <Input
                        id="template-name"
                        placeholder="Ex: Template padrão de NF"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto</Label>
                      <Input
                        id="subject"
                        placeholder="Ex: Solicitação de Nota Fiscal - {mes_referencia}"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Conteúdo</Label>
                      <Textarea
                        id="content"
                        className="min-h-[300px]"
                        placeholder={`Ex: Olá {nome_funcionario},\n\nPor favor, envie sua nota fiscal referente ao mês de {mes_referencia}...`}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSaveTemplate}>Salvar Template</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Variáveis Disponíveis */}
              <Card>
                <CardHeader>
                  <CardTitle>Variáveis Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {variablesList[type as keyof typeof variablesList].map((variable) => (
                      <div key={variable.name} className="flex flex-col space-y-1">
                        <code className="text-sm font-mono bg-muted p-1 rounded">
                          {variable.name}
                        </code>
                        <span className="text-sm text-muted-foreground">
                          {variable.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
