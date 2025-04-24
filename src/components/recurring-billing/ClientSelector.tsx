
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientSelectorProps {
  clients: Array<{ id: string; name: string; responsible_name?: string; partner_name?: string }>;
  onSelect: (clientId: string) => void;
  initialValue?: string;
}

export const ClientSelector = ({ clients, onSelect, initialValue }: ClientSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Cliente</Label>
      <Select 
        onValueChange={(value) => {
          console.log("Selected client:", value);
          // Find the selected client to log the responsible_name for debugging
          const selectedClient = clients.find(client => client.id === value);
          if (selectedClient) {
            console.log("Selected client responsible_name:", selectedClient.responsible_name);
            console.log("Selected client partner_name:", selectedClient.partner_name);
          }
          onSelect(value);
        }}
        defaultValue={initialValue}
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
