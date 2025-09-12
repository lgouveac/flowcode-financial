import { Client } from "@/types/client";
import { EditableCell } from "@/components/EditableCell";
import { MailIcon, PhoneIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientRowProps {
  client: Client;
  onUpdate: (id: string, field: keyof Client, value: string | number) => void;
  onClick: () => void;
  onDelete?: (client: Client) => void;
}

export const ClientRow = ({ client, onUpdate, onClick, onDelete }: ClientRowProps) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(client);
    }
  };

  return (
    <tr 
      className="border-b transition-colors hover:bg-muted/50 cursor-pointer" 
      onClick={onClick}
    >
      <td className="py-2 px-4">
        <div className="line-clamp-2 text-sm leading-5 max-h-10 overflow-hidden">
          <EditableCell
            value={client.name}
            onChange={(value) => onUpdate(client.id, 'name', value)}
          />
        </div>
      </td>
      <td className="py-2 px-4 hidden md:table-cell">
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <EditableCell
              value={client.email}
              onChange={(value) => onUpdate(client.id, 'email', value)}
              type="email"
            />
          </div>
          <div className="flex items-center">
            <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <EditableCell
              value={client.phone || ""}
              onChange={(value) => onUpdate(client.id, 'phone', value)}
            />
          </div>
        </div>
      </td>
      <td className="py-2 px-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          client.status === "active" 
            ? "bg-green-100 text-green-800" 
            : client.status === "overdue"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-800"
        }`}>
          {client.status === "active" ? "Ativo" 
            : client.status === "overdue" ? "Inadimplente"
            : "Inativo"}
        </span>
      </td>
      <td className="py-2 px-4 hidden sm:table-cell">
        <EditableCell
          value={client.total_billing?.toString() || "0"}
          onChange={(value) => onUpdate(client.id, 'total_billing', parseFloat(value) || 0)}
          type="number"
        />
      </td>
      <td className="py-2 px-4 hidden lg:table-cell">
        <EditableCell
          value={client.last_payment || ""}
          onChange={(value) => onUpdate(client.id, 'last_payment', value)}
          type="date"
        />
      </td>
      <td className="py-2 px-4 text-right">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={handleDeleteClick}
          title="Excluir cliente"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};
