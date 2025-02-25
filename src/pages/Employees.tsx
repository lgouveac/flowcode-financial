
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeTable } from "@/components/EmployeeTable";
import { EmployeeSettings } from "@/components/EmployeeSettings";

export const Employees = () => {
  return (
    <Tabs defaultValue="list" className="space-y-6">
      <TabsList>
        <TabsTrigger value="list">Lista de Funcionários</TabsTrigger>
        <TabsTrigger value="settings">Configurações</TabsTrigger>
      </TabsList>

      <TabsContent value="list">
        <EmployeeTable />
      </TabsContent>

      <TabsContent value="settings">
        <EmployeeSettings />
      </TabsContent>
    </Tabs>
  );
};
