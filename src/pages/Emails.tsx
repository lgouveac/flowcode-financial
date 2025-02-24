
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavedTemplatesTable } from "@/components/emails/SavedTemplatesTable";
import { TemplateSection } from "@/components/emails/TemplateSection";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";

export const Emails = () => {
  const [currentSection, setCurrentSection] = useState<'employees' | 'clients'>('employees');
  const { savedTemplates, isLoading, handleTemplateUpdate, handleTemplateDelete, saveNewTemplate } = useEmailTemplates();

  const handleSectionChange = (section: string) => {
    setCurrentSection(section as 'clients' | 'employees');
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
          <TemplateSection
            type="employees"
            onSaveTemplate={saveNewTemplate}
          />
        </TabsContent>

        <TabsContent value="clients">
          <TemplateSection
            type="clients"
            onSaveTemplate={saveNewTemplate}
          />
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
