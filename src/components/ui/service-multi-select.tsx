import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useServices } from "@/hooks/useServices";

interface ServiceMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ServiceMultiSelect({
  value = [],
  onChange,
  placeholder = "Selecione serviços...",
  disabled = false
}: ServiceMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const { services, loading } = useServices();

  // Serviços padrão caso não existam no banco
  const defaultServices = [
    "Desenvolvimento Web",
    "Consultoria",
    "Design",
    "Marketing Digital",
    "Suporte Técnico",
    "Treinamento",
    "Análise de Dados",
    "Criação de Conteúdo"
  ];

  const availableServices = services.length > 0 ? services : defaultServices;
  
  console.log('🎯 ServiceMultiSelect render:', {
    loading,
    servicesCount: services.length,
    services: services,
    usingDefault: services.length === 0,
    availableServicesCount: availableServices.length,
    currentValue: value
  });

  const handleSelect = (selectedService: string) => {
    if (value.includes(selectedService)) {
      onChange(value.filter((item) => item !== selectedService));
    } else {
      onChange([...value, selectedService]);
    }
  };

  const handleRemove = (serviceToRemove: string) => {
    onChange(value.filter((item) => item !== serviceToRemove));
  };

  if (loading) {
    return (
      <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
        Carregando serviços...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <span>
                {value.length === 1 
                  ? value[0]
                  : `${value.length} serviços selecionados`
                }
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar serviços..." />
            <CommandList>
              <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
              <CommandGroup>
                {availableServices.map((service) => (
                  <CommandItem
                    key={service}
                    value={service}
                    onSelect={() => handleSelect(service)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(service) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {service}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected services badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((service) => (
            <Badge
              key={service}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {service}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleRemove(service)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}