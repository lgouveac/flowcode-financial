
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";

export const EmptyState: React.FC = () => (
  <TableRow>
    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
      Nenhum recebimento encontrado
    </TableCell>
  </TableRow>
);
