
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { AddEmployeeDialog } from "../AddEmployeeDialog";

interface TableHeaderProps {
  onSettingsClick: () => void;
}

export const TableHeader = ({ onSettingsClick }: TableHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold">Funcionários e Freelancers</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onSettingsClick}
          title="Configurações de email"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <AddEmployeeDialog />
      </div>
    </div>
  );
};

