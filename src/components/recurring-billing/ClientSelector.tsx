
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

interface ClientSelectorProps {
  clients: { id: string; name: string }[];
  onSelect: (clientId: string) => void;
  initialValue?: string;
  disabled?: boolean;
}

export function ClientSelector({ clients, onSelect, initialValue = "", disabled = false }: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(initialValue);

  // Update selectedClientId when initialValue changes
  useEffect(() => {
    if (initialValue) {
      setSelectedClientId(initialValue);
    }
  }, [initialValue]);

  const handleSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    onSelect(clientId);
    setOpen(false);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", disabled && "opacity-70 cursor-not-allowed")}
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
        >
          {selectedClient ? selectedClient.name : "Selecione o cliente"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandEmpty>Nenhum cliente encontrado</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {clients.map((client) => (
              <CommandItem
                key={client.id}
                value={client.name}
                onSelect={() => handleSelect(client.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedClientId === client.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {client.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
