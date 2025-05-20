
import { Check, ChevronsUpDown } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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

export function ClientSelector({ 
  clients = [], 
  onSelect, 
  initialValue = "", 
  disabled = false 
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(initialValue);
  
  // Garantir que clients sempre seja um array
  const safeClients = Array.isArray(clients) ? clients : [];

  // Atualizar selectedClientId quando initialValue mudar
  useEffect(() => {
    if (initialValue) {
      setSelectedClientId(initialValue);
    }
  }, [initialValue]);

  // Criar função handleSelect com useCallback para evitar recriações desnecessárias
  const handleSelect = useCallback((clientId: string) => {
    try {
      setSelectedClientId(clientId);
      onSelect(clientId);
      setOpen(false);
    } catch (error) {
      console.error("Error in ClientSelector handleSelect:", error);
    }
  }, [onSelect]);

  // Encontrar o cliente selecionado
  const selectedClient = safeClients.find(c => c.id === selectedClientId);

  return (
    <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-background", disabled && "opacity-70 cursor-not-allowed")}
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
        >
          {selectedClient ? selectedClient.name : "Selecione o cliente"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {open && !disabled && (
        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0" 
          align="start"
          sideOffset={5}
          style={{ backgroundColor: 'white', zIndex: 1000 }}
        >
          <Command className="bg-background">
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
                <CommandItem disabled>
                  Nenhum cliente disponível
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}
