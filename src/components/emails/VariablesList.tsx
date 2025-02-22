
import { GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Variable } from "@/types/email";

interface VariablesListProps {
  variables: Variable[];
  onDragStart: (e: React.DragEvent, variable: string) => void;
}

export const VariablesList = ({ variables, onDragStart }: VariablesListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Variáveis Disponíveis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {variables.map((variable) => (
            <div
              key={variable.name}
              className="flex items-start space-x-2 p-2 rounded border border-border cursor-move hover:bg-accent"
              draggable
              onDragStart={(e) => onDragStart(e, variable.name)}
            >
              <GripVertical className="h-4 w-4 mt-1 text-muted-foreground" />
              <div className="flex flex-col space-y-1">
                <code className="text-sm font-mono bg-muted p-1 rounded">
                  {variable.name}
                </code>
                <span className="text-sm text-muted-foreground">
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
