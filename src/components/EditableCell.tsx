
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
}

export const EditableCell = ({ value, onChange, type = "text", className = "" }: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const { toast } = useToast();

  const handleEdit = () => {
    setIsEditing(true);
    setTempValue(value);
  };

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
    toast({
      title: "Alteração salva",
      description: "O valor foi atualizado com sucesso.",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempValue(value);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          type={type}
          className={`h-8 ${className}`}
          autoFocus
        />
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleSave}>
            <CheckIcon className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <XIcon className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between group">
      <span>{value}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <PencilIcon className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
};
