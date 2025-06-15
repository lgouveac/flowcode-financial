
import { MetricCard } from "./MetricCard";
import { FileText, Calculator } from "lucide-react";

interface MetricsSectionProps {
  title: string;
  metrics: Array<{
    title: string;
    value: string;
    change: string;
    description: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  }>;
  isLoading: boolean;
  icon?: React.ReactNode;
}

export const MetricsSection = ({ title, metrics, isLoading, icon }: MetricsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, i) => (
          <MetricCard
            key={metric.title}
            {...metric}
            index={i}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};
