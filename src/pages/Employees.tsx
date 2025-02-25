
import { EmployeeTable } from "@/components/EmployeeTable";
import { EmployeeSettings } from "@/components/EmployeeSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EmployeesPage() {
  return (
    <div className="container py-10 space-y-8">
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <EmployeeTable />
        </TabsContent>
        <TabsContent value="settings">
          <EmployeeSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
