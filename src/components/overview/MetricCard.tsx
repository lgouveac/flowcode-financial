
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  description: string;
  index: number;
  isLoading?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export const MetricCard = ({ 
  title, 
  value, 
  change, 
  description, 
  index, 
  isLoading = false,
  onClick,
  icon 
}: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card 
        className={onClick ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-4 w-[60px]" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
                <span className={`text-sm ${
                  change.startsWith('+') ? 'text-green-500' : 
                  change === '0%' ? 'text-gray-500' : 
                  'text-red-500'
                }`}>
                  {change}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{description}</p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
