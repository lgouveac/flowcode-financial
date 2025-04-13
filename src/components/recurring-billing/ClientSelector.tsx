
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientSelectorProps {
  clients: Array<{ id: string; name: string; responsible_name?: string; partner_name?: string }>;
  onSelect: (clientId: string) => void;
}

export const ClientSelector = ({ clients, onSelect }: ClientSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Cliente</Label>
      <Select 
        onValueChange={(value) => {
          console.log("Selected client:", value);
          onSelect(value);
        }}
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione o cliente" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
