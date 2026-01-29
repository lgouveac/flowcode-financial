import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Column<T extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface TableMobileCardProps<T extends Record<string, unknown> = Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function TableMobileCard<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  emptyMessage = "Nenhum item encontrado",
  className,
}: TableMobileCardProps<T>) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null; // Renderizar tabela normal em desktop
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((row, idx) => {
        const visibleColumns = columns.filter((col) => !col.hideOnMobile);
        
        return (
          <Card
            key={idx}
            className={cn(
              "p-4 cursor-pointer transition-colors",
              onRowClick && "hover:bg-accent/50 active:bg-accent"
            )}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-0 space-y-2.5">
              {visibleColumns.map((column) => {
                const value = row[column.key];
                const displayValue = column.render
                  ? column.render(value, row)
                  : value ?? "-";

                return (
                  <div
                    key={column.key}
                    className={cn(
                      "flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1",
                      column.className
                    )}
                  >
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {column.label}
                    </span>
                    <span className="text-sm text-foreground font-medium text-right sm:text-left">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

