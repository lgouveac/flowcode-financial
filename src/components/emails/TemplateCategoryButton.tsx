
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TemplateCategoryButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
}

export const TemplateCategoryButton = ({
  icon: Icon,
  label,
  onClick,
  active = false,
}: TemplateCategoryButtonProps) => {
  return (
    <Button
      variant="outline"
      className={cn(
        "flex flex-col items-center justify-center gap-1 h-20 w-full",
        "text-sm border-2",
        active && "border-primary bg-primary/5"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span className="text-center text-xs">{label}</span>
    </Button>
  );
};
