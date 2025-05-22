
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  id: string;
  name: string;
}

interface ClientSelectorProps {
  clients: Client[];
  onSelect: (clientId: string) => void;
  initialValue?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function ClientSelector({ 
  clients, 
  onSelect, 
  initialValue = "", 
  disabled = false,
  loading = false
}: ClientSelectorProps) {
  const [selectedClientId, setSelectedClientId] = useState(initialValue);
  
  // Ensure clients is always a valid array
  const safeClients = Array.isArray(clients) ? clients.filter(client => 
    client && typeof client === 'object' && client.id && client.name
  ) : [];
  
  useEffect(() => {
    if (initialValue) {
      setSelectedClientId(initialValue);
    }
  }, [initialValue]);

  const handleSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    onSelect(clientId);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Select 
      value={selectedClientId} 
      onValueChange={handleSelect}
      disabled={disabled}
    >
      <SelectTrigger className="w-full bg-background">
        <SelectValue placeholder="Selecione o cliente" />
      </SelectTrigger>
      <SelectContent 
        className="bg-background max-h-[300px]"
        style={{
          backgroundColor: 'var(--background)',
          zIndex: 1000,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        {safeClients.length > 0 ? (
          safeClients.map((client) => (
            <SelectItem key={client.id} value={client.id} className="hover:bg-accent">
              {client.name}
            </SelectItem>
          ))
        ) : (
          <div className="p-2 text-center text-sm text-muted-foreground">
            Nenhum cliente disponível
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
