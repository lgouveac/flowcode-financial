
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Employee {
  id: string;
  name: string;
  type: "fixed" | "freelancer";
  status: "active" | "inactive";
  payment_method: string;
  last_invoice?: string;
  email: string;
}

interface EmployeeTableRowProps {
  employee: Employee;
  onClick: (employee: Employee) => void;
  onStatusChange?: (value: "active" | "inactive") => void;
}

export const EmployeeTableRow = ({ employee, onClick, onStatusChange }: EmployeeTableRowProps) => {
  const handleClick = () => {
    onClick(employee);
  };

  const handleStatusChange = (value: string) => {
    if (onStatusChange && (value === "active" || value === "inactive")) {
      onStatusChange(value);
    }
  };

  return (
    <tr
      className="border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={handleClick}
    >
      <td className="py-3 px-4 text-sm">{employee.name}</td>
      <td className="py-3 px-4 text-sm hidden sm:table-cell capitalize">
        {employee.type === "fixed" ? "CLT" : "Freelancer"}
      </td>
      <td className="py-3 px-4 text-sm" onClick={(e) => e.stopPropagation()}>
        <Select
          defaultValue={employee.status}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="h-8 w-28">
            <SelectValue>
              <Badge
                variant={employee.status === "active" ? "default" : "outline"}
                className={
                  employee.status === "active"
                    ? "bg-green-500 hover:bg-green-500 text-white"
                    : "bg-transparent text-muted-foreground"
                }
              >
                {employee.status === "active" ? "Ativo" : "Inativo"}
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">
              <Badge className="bg-green-500 hover:bg-green-500 text-white">
                Ativo
              </Badge>
            </SelectItem>
            <SelectItem value="inactive">
              <Badge variant="outline" className="bg-transparent text-muted-foreground">
                Inativo
              </Badge>
            </SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="py-3 px-4 text-sm hidden md:table-cell">
        {employee.payment_method || "—"}
      </td>
      <td className="py-3 px-4 text-sm hidden lg:table-cell">
        {employee.last_invoice
          ? new Date(employee.last_invoice).toLocaleDateString("pt-BR")
          : "—"}
      </td>
    </tr>
  );
};
