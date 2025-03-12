import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PencilIcon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const EditableCell = ({ 
  value, 
  onChange, 
  type = "text", 
  className = "",
  onClick 
}: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const { toast } = useToast();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTempValue(value);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setTempValue(value);
  };

  const handleCellClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(tempValue);
    setIsEditing(false);
    toast({
      title: "Alteração salva",
      description: "O valor foi atualizado com sucesso.",
    });
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
        <Input
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          type={type}
          className={`h-8 text-base ${className}`}
          autoFocus
          step={type === "number" ? "0.01" : undefined}
          min={type === "number" ? "0" : undefined}
        />
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleSave} className="h-8 w-8 p-0">
            <CheckIcon className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0">
            <XIcon className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-between group/cell" onClick={handleCellClick}>
      <span className="flex-1">{value}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
        className="absolute right-0 h-8 w-8 p-0 opacity-0 group-hover/cell:opacity-100 transition-opacity"
      >
        <PencilIcon className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
};
