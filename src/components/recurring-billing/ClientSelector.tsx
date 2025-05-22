
import { Check, ChevronsUpDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(initialValue);
  
  // Garantir que clients é sempre um array válido
  const safeClients = Array.isArray(clients) ? clients.filter(client => 
    client && typeof client === 'object' && client.id && client.name
  ) : [];
  
  useEffect(() => {
    if (initialValue) {
      setSelectedClientId(initialValue);
    }
  }, [initialValue]);

  const selectedClient = safeClients.find(c => c.id === selectedClientId);

  const handleSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    onSelect(clientId);
    setOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-background", disabled && "opacity-70 cursor-not-allowed")}
          disabled={disabled}
        >
          {selectedClient ? selectedClient.name : "Selecione o cliente"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {!disabled && (
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Buscar cliente..." />
            <CommandEmpty>Nenhum cliente encontrado</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {safeClients.length > 0 ? (
                safeClients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.name}
                    onSelect={() => handleSelect(client.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClientId === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {client.name}
                  </CommandItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Nenhum cliente disponível
                </div>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}
