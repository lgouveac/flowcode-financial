
interface Employee {
  id: string;
  name: string;
  type: "fixed" | "freelancer";
  status: "active" | "inactive";
  payment_method: string;
  last_invoice?: string;
  cnpj?: string;
  pix?: string;
  address?: string;
  position?: string;
  phone?: string;
  email: string;
}

interface EmployeeTableRowProps {
  employee: Employee;
  onClick: (employee: Employee) => void;
}

export const EmployeeTableRow = ({ employee, onClick }: EmployeeTableRowProps) => {
  return (
    <tr
      className="border-t border-border/50 hover:bg-muted/50 transition-colors cursor-pointer text-sm"
      onClick={() => onClick(employee)}
    >
      <td className="p-4">{employee.name}</td>
      <td className="p-4 hidden sm:table-cell">
        {employee.type === "fixed" ? "Funcionário Fixo" : "Freelancer"}
      </td>
      <td className="p-4">
        {employee.status === "active" ? "Ativo" : "Inativo"}
      </td>
      <td className="p-4 hidden md:table-cell">
        {employee.payment_method || "-"}
      </td>
      <td className="p-4 hidden lg:table-cell">
        {employee.last_invoice || "-"}
      </td>
    </tr>
  );
};

