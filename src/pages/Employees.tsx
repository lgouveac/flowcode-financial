
import { useState } from "react";
import { EmployeeTable } from "@/components/EmployeeTable"; 
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmployeeRegistrationDialog } from "@/components/employees/EmployeeRegistrationDialog";
import { ShareEmployeeFormButton } from "@/components/employees/ShareEmployeeFormButton";

export default function EmployeesPage() {
  const [openRegistrationDialog, setOpenRegistrationDialog] = useState(false);
  const { toast } = useToast();

  const handleRegistrationSuccess = () => {
    toast({
      title: "Funcionário adicionado",
      description: "O funcionário foi adicionado com sucesso ao sistema."
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Funcionários e Freelancers</h1>
        <div className="flex gap-2">
          <ShareEmployeeFormButton />
          <Button onClick={() => setOpenRegistrationDialog(true)}>
            <PlusIcon className="h-4 w-4 mr-2" /> Novo Colaborador
          </Button>
        </div>
      </div>
      
      <EmployeeTable />
      
      <EmployeeRegistrationDialog
        open={openRegistrationDialog}
        onOpenChange={setOpenRegistrationDialog}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
