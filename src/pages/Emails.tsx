
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { TemplateSection } from "@/components/emails/TemplateSection";
import { createTemplate } from "@/services/templateService";
import { EmailTemplate, EmailTemplateSubtype } from "@/types/email";
import { useToast } from "@/hooks/use-toast";
import { EmployeeEmailSettings } from "@/components/emails/EmployeeEmailSettings";
import { NotificationSettings } from "@/components/emails/NotificationSettings";
import { Settings, History, SendIcon, FileText } from "lucide-react";
import { EmailSendSection } from "@/components/emails/EmailSendSection";
import { EmailHistorySection } from "@/components/emails/EmailHistorySection";
import { EmailSettingsSection } from "@/components/emails/EmailSettingsSection";

const Emails = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [type, setType] = useState<"clients" | "employees">("clients");
  const [subtype, setSubtype] = useState<EmailTemplateSubtype>("recurring");
  const [employeeSettingsOpen, setEmployeeSettingsOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveTemplate = async (template: Partial<EmailTemplate>) => {
    try {
      await createTemplate(template);
      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso!"
      });
      return true;
    } catch (error: any) {
      console.error("Error creating template:", error);
      toast({
        title: "Erro ao criar template",
        description: error.message || "Ocorreu um erro ao criar o template",
        variant: "destructive"
      });
      return false;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">E-mails</h1>
          <p className="text-muted-foreground">
            Gerencie templates, envie e-mails, consulte histórico e configure notificações
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <SendIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Envio</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex space-x-2">
                      <Button
                        variant={type === "clients" ? "default" : "outline"}
                        onClick={() => setType("clients")}
                      >
                        Clientes
                      </Button>
                      <Button
                        variant={type === "employees" ? "default" : "outline"}
                        onClick={() => setType("employees")}
                      >
                        Funcionários
                      </Button>
                    </div>

                    <div className="flex space-x-2">
                      {type === "clients" && (
                        <>
                          <Button
                            variant={subtype === "recurring" ? "default" : "outline"}
                            onClick={() => setSubtype("recurring")}
                            size="sm"
                          >
                            Cobrança Recorrente
                          </Button>
                          <Button
                            variant={subtype === "oneTime" ? "default" : "outline"}
                            onClick={() => setSubtype("oneTime")}
                            size="sm"
                          >
                            Cobrança Pontual
                          </Button>
                          <Button
                            variant={subtype === "contract" ? "default" : "outline"}
                            onClick={() => setSubtype("contract")}
                            size="sm"
                          >
                            Contrato
                          </Button>
                          <Button
                            variant={subtype === "novo_subtipo" ? "default" : "outline"}
                            onClick={() => setSubtype("novo_subtipo")}
                            size="sm"
                          >
                            Novo Subtipo
                          </Button>
                        </>
                      )}
                      {type === "employees" && (
                        <>
                          <Button
                            variant={subtype === "invoice" ? "default" : "outline"}
                            onClick={() => setSubtype("invoice")}
                            size="sm"
                          >
                            Nota Fiscal
                          </Button>
                          <Button
                            variant={subtype === "hours" ? "default" : "outline"}
                            onClick={() => setSubtype("hours")}
                            size="sm"
                          >
                            Horas
                          </Button>
                          <Button
                            variant={subtype === "novo_subtipo" ? "default" : "outline"}
                            onClick={() => setSubtype("novo_subtipo")}
                            size="sm"
                          >
                            Novo Subtipo
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <TemplateSection
                    type={type}
                    subtype={subtype}
                    onSaveTemplate={handleSaveTemplate}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="send">
            <EmailSendSection />
          </TabsContent>

          <TabsContent value="history">
            <EmailHistorySection />
          </TabsContent>

          <TabsContent value="settings">
            <EmailSettingsSection 
              onOpenEmployeeSettings={() => setEmployeeSettingsOpen(true)}
              onOpenNotificationSettings={() => setNotificationSettingsOpen(true)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <EmployeeEmailSettings
        open={employeeSettingsOpen}
        onClose={() => setEmployeeSettingsOpen(false)}
      />

      <NotificationSettings
        open={notificationSettingsOpen}
        onClose={() => setNotificationSettingsOpen(false)}
      />
    </div>
  );
};

export default Emails;
