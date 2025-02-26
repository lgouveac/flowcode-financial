
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavedTemplatesTable } from "@/components/emails/SavedTemplatesTable";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";

export const Emails = () => {
  const [currentSection, setCurrentSection] = useState<'employees' | 'clients'>('employees');
  const { savedTemplates, isLoading, handleTemplateUpdate } = useEmailTemplates();

  const filteredTemplates = savedTemplates.filter(template => template.type === currentSection);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="employees" className="w-full" onValueChange={(value) => setCurrentSection(value as 'employees' | 'clients')}>
        <TabsList className="mb-4">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <SavedTemplatesTable 
            templates={filteredTemplates} 
            onTemplateUpdate={handleTemplateUpdate}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="clients">
          <SavedTemplatesTable 
            templates={filteredTemplates} 
            onTemplateUpdate={handleTemplateUpdate}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

