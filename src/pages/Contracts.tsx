
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContractTable } from "@/components/contracts/ContractTable";
import { NDAContractsTab } from "@/components/contracts/NDAContractsTab";
import { ColaboradorContractsTab } from "@/components/contracts/ColaboradorContractsTab";
import { DocumentsTab } from "@/components/contracts/DocumentsTab";
import { WebhookConfigModal } from "@/components/contracts/WebhookConfigModal";
import { FileText, Shield, Users, Settings, FileSignature } from "lucide-react";

export default function Contracts() {
  const [activeTab, setActiveTab] = useState("service-contracts");
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gestão de Contratos</h1>
        <p className="text-muted-foreground">
          Gerencie diferentes tipos de contratos e documentos legais
        </p>
      </div>

      {/* Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="service-contracts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Prestação de Serviço</span>
              <span className="sm:hidden">Serviços</span>
            </TabsTrigger>
            <TabsTrigger value="nda-contracts" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">NDAs</span>
              <span className="sm:hidden">NDA</span>
            </TabsTrigger>
            <TabsTrigger value="collaborator-contracts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Colaboradores</span>
              <span className="sm:hidden">Colaboradores</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              <span className="hidden sm:inline">Documentos</span>
              <span className="sm:hidden">Docs</span>
            </TabsTrigger>
          </TabsList>

          {/* Service Contracts Tab */}
          <TabsContent value="service-contracts" className="space-y-6">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWebhookModalOpen(true)}
                className="absolute -top-2 -right-2 h-8 w-8 p-0 z-10"
                title="Configurar Webhooks"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <ContractTable />
            </div>
          </TabsContent>

          {/* NDA Contracts Tab */}
          <TabsContent value="nda-contracts" className="space-y-6">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWebhookModalOpen(true)}
                className="absolute -top-2 -right-2 h-8 w-8 p-0 z-10"
                title="Configurar Webhooks"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <NDAContractsTab />
            </div>
          </TabsContent>

          {/* Collaborator Contracts Tab */}
          <TabsContent value="collaborator-contracts" className="space-y-6">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWebhookModalOpen(true)}
                className="absolute -top-2 -right-2 h-8 w-8 p-0 z-10"
                title="Configurar Webhooks"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <ColaboradorContractsTab />
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWebhookModalOpen(true)}
                className="absolute -top-2 -right-2 h-8 w-8 p-0 z-10"
                title="Configurar Webhooks"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <DocumentsTab />
            </div>
          </TabsContent>
      </Tabs>

      {/* Webhook Configuration Modal */}
      <WebhookConfigModal
        open={webhookModalOpen}
        onClose={() => setWebhookModalOpen(false)}
        contractType={
          activeTab === "service-contracts" ? "prestacao_servico" :
          activeTab === "nda-contracts" ? "nda" :
          activeTab === "documents" ? "documents" : "profissionais"
        }
        title={
          activeTab === "service-contracts" ? "Prestação de Serviço" :
          activeTab === "nda-contracts" ? "NDAs" :
          activeTab === "documents" ? "Documentos" : "Colaboradores"
        }
      />
    </div>
  );
}
