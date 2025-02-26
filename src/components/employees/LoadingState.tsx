
import { TableHeader } from "./TableHeader";

interface LoadingStateProps {
  onSettingsClick: () => void;
}

export const LoadingState = ({ onSettingsClick }: LoadingStateProps) => {
  return (
    <div className="space-y-8">
      <TableHeader onSettingsClick={onSettingsClick} />
      <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-8">
        <p className="text-center text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
};

