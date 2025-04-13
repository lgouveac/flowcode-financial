
import { GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Variable } from "@/types/email";

interface VariablesListProps {
  variables: Variable[];
  onDragStart: (e: React.DragEvent, variable: string) => void;
}

export const VariablesList = ({ variables, onDragStart }: VariablesListProps) => {
  return (
    <Card className="sticky top-4">
      <CardHeader className="px-3 py-2 sm:px-4 sm:py-3">
        <CardTitle className="text-base sm:text-lg">Variáveis Disponíveis</CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-2 sm:px-4 sm:py-3">
        <div className="space-y-2 sm:space-y-3 max-h-[50vh] lg:max-h-[70vh] overflow-y-auto pr-1">
          {variables.map((variable) => (
            <div
              key={variable.name}
              className="flex items-start space-x-2 p-2 rounded border border-border cursor-move hover:bg-accent hover:shadow-sm transition-all"
              draggable
              onDragStart={(e) => onDragStart(e, variable.name)}
            >
              <GripVertical className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col space-y-1 flex-1 min-w-0">
                <code className="text-xs sm:text-sm font-mono bg-muted p-1 rounded break-all">
                  {variable.name}
                </code>
                <span className="text-xs sm:text-sm text-muted-foreground break-words">
                  {variable.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
