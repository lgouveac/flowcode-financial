
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Mail, Clock, Users } from "lucide-react";

interface EmailSettingsSectionProps {
  onOpenEmployeeSettings: () => void;
  onOpenNotificationSettings: () => void;
}

export const EmailSettingsSection = ({ 
  onOpenEmployeeSettings, 
  onOpenNotificationSettings 
}: EmailSettingsSectionProps) => {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Geral</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Funcionários</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais de Email</CardTitle>
              <CardDescription>
                Configure as opções gerais para o envio de emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium">Cópias de Email (CC/BCC)</h3>
                <p className="text-sm text-muted-foreground">
                  Configure endereços de email para receber cópias de todos os emails enviados.
                </p>
                <Button size="sm" variant="outline">
                  Configurar CC/BCC
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Email de Resposta (Reply-To)</h3>
                <p className="text-sm text-muted-foreground">
                  Defina o endereço de email que receberá as respostas.
                </p>
                <Button size="sm" variant="outline">
                  Configurar Reply-To
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Nome do Remetente</h3>
                <p className="text-sm text-muted-foreground">
                  Configure o nome que aparecerá como remetente dos emails.
                </p>
                <Button size="sm" variant="outline">
                  Configurar Remetente
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notificações para Clientes</CardTitle>
              <CardDescription>
                Configure as notificações automáticas para clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium">Lembretes de Pagamento</h3>
                <p className="text-sm text-muted-foreground">
                  Configure os intervalos e horários para envio de lembretes de pagamento.
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onOpenNotificationSettings}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Configurar Lembretes
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Agradecimento de Pagamento</h3>
                <p className="text-sm text-muted-foreground">
                  Configure emails automáticos de agradecimento após pagamentos.
                </p>
                <Button size="sm" variant="outline">
                  Configurar Agradecimentos
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Boas-vindas a Novos Clientes</h3>
                <p className="text-sm text-muted-foreground">
                  Configure emails automáticos de boas-vindas para novos clientes.
                </p>
                <Button size="sm" variant="outline">
                  Configurar Boas-vindas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notificações para Funcionários</CardTitle>
              <CardDescription>
                Configure as notificações automáticas para funcionários.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium">Solicitação de Nota Fiscal</h3>
                <p className="text-sm text-muted-foreground">
                  Configure o dia do mês e horário para envio automático de solicitações de NF.
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onOpenEmployeeSettings}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Configurar Solicitações
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Lembretes de Horas</h3>
                <p className="text-sm text-muted-foreground">
                  Configure lembretes para registro de horas trabalhadas.
                </p>
                <Button size="sm" variant="outline">
                  Configurar Lembretes
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Onboarding de Funcionários</h3>
                <p className="text-sm text-muted-foreground">
                  Configure emails automáticos para novos funcionários.
                </p>
                <Button size="sm" variant="outline">
                  Configurar Onboarding
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
