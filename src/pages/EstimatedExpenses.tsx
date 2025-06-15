
import { EstimatedExpensesDialog } from "@/components/cash-flow/EstimatedExpensesDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export const EstimatedExpenses = () => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Despesas Estimadas</h1>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Gerenciar Despesas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerencie suas despesas estimadas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Configure e gerencie suas despesas estimadas mensais e recorrentes.
          </p>
          <Button onClick={() => setShowDialog(true)} variant="outline">
            Abrir Gerenciador
          </Button>
        </CardContent>
      </Card>

      <EstimatedExpensesDialog 
        open={showDialog} 
        onClose={() => setShowDialog(false)} 
      />
    </div>
  );
};

export default EstimatedExpenses;
