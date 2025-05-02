
import { GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Variable } from "@/types/email";

interface VariablesListProps {
  variables: Variable[];
  onDragStart: (e: React.DragEvent, variable: string) => void;
}

export const VariablesList = ({ variables, onDragStart }: VariablesListProps) => {
  // Add debug log to check variables being received
  console.log("VariablesList received variables:", variables);
  
  return (
    <Card className="sticky top-4 w-full">
      <CardHeader className="px-3 py-2">
        <CardTitle className="text-sm">Variáveis Disponíveis</CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-2">
        <div className="space-y-1.5 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
          {variables && variables.length > 0 ? (
            variables.map((variable) => (
              <div
                key={variable.name}
                className="flex items-start space-x-2 p-1.5 rounded border border-border cursor-move hover:bg-accent hover:shadow-sm transition-all"
                draggable
                onDragStart={(e) => onDragStart(e, variable.name)}
              >
                <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
                  <code className="text-xs font-mono bg-muted p-1 rounded break-all">
                    {variable.name}
                  </code>
                  <span className="text-xs text-muted-foreground break-words">
                    {variable.description}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-3 text-muted-foreground text-sm">
              Nenhuma variável disponível para este tipo de template.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
