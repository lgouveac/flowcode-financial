import { useState } from "react";
import { EmployeeTable } from "@/components/EmployeeTable";
import { EmployeeSettings } from "@/components/EmployeeSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { EmployeeRegistrationDialog } from "@/components/employees/EmployeeRegistrationDialog";
import { ShareEmployeeFormButton } from "@/components/employees/ShareEmployeeFormButton";
export default function EmployeesPage() {
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Funcionários</h1>
        <div className="flex gap-2">
          <ShareEmployeeFormButton />
          <Button onClick={() => setRegistrationDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>
      </div>
      <Tabs defaultValue="list" className="w-full">
        
        <TabsContent value="list" className="mt-0">
          <EmployeeTable />
        </TabsContent>
        <TabsContent value="settings" className="mt-0">
          <EmployeeSettings />
        </TabsContent>
      </Tabs>

      <EmployeeRegistrationDialog open={registrationDialogOpen} onOpenChange={setRegistrationDialogOpen} onSuccess={() => {
      // Refresh employee list
      window.location.reload();
    }} />
    </div>;
}