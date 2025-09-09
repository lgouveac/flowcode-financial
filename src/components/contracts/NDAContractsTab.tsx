import { useState } from "react";
import { Shield, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewNDAContractDialog } from "./NewNDAContractDialog";

export function NDAContractsTab() {
  const [newNDAOpen, setNewNDAOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 p-4 bg-blue-50 rounded-full">
          <Shield className="h-12 w-12 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Contratos NDA
        </h3>
        <p className="text-gray-600 mb-6 max-w-md line-clamp-2 text-sm leading-5 max-h-10 overflow-hidden">
          Crie acordos de confidencialidade (NDA) para clientes e funcionários.
        </p>
        
        <Button onClick={() => setNewNDAOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Criar Novo NDA
        </Button>
      </div>

      <NewNDAContractDialog
        open={newNDAOpen}
        onClose={() => setNewNDAOpen(false)}
      />
    </>
  );
}