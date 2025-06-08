
import { ContractTable } from "@/components/contracts/ContractTable";

export default function Contracts() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie contratos com clientes
          </p>
        </div>
        
        <ContractTable />
      </div>
    </div>
  );
}
