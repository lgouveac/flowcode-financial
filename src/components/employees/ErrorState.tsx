
import { TableHeader } from "./TableHeader";

interface ErrorStateProps {
  onSettingsClick: () => void;
}

export const ErrorState = ({ onSettingsClick }: ErrorStateProps) => {
  return (
    <div className="space-y-8">
      <TableHeader onSettingsClick={onSettingsClick} />
      <div className="rounded-lg border bg-destructive/10 p-8">
        <p className="text-center text-destructive">Erro ao carregar funcionários</p>
      </div>
    </div>
  );
};

