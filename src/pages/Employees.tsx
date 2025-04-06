
import { EmployeeTable } from "@/components/EmployeeTable";
import { EmployeeSettings } from "@/components/EmployeeSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Funcionários</h1>
      </div>
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full mb-4 flex overflow-x-auto no-scrollbar sm:w-auto sm:inline-flex">
          <TabsTrigger value="list" className="flex-1 sm:flex-none">Lista</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 sm:flex-none">Configurações</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-0">
          <EmployeeTable />
        </TabsContent>
        <TabsContent value="settings" className="mt-0">
          <EmployeeSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
