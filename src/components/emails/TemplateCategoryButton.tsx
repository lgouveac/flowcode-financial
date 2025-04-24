
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
        "flex flex-col items-center justify-center gap-2 h-24 w-full sm:w-48",
        "text-sm border-2",
        active && "border-primary bg-primary/5"
      )}
      onClick={onClick}
    >
      <Icon className="h-6 w-6" />
      <span className="text-center">{label}</span>
    </Button>
  );
};
