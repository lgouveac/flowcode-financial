
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Payment } from "@/types/payment";

interface PaymentWithClient extends Payment {
  clients: {
    name: string;
  };
}

interface PaymentSelectorProps {
  payments: PaymentWithClient[];
  selectedPayment: string;
  onSelect: (paymentId: string) => void;
  isLoading?: boolean;
}

export const PaymentSelector = ({ 
  payments, 
  selectedPayment, 
  onSelect,
  isLoading = false
}: PaymentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Garantir que payments nunca seja undefined para evitar o erro
  const safePayments = Array.isArray(payments) ? payments : [];

  const selectedPaymentData = safePayments.find((payment) => payment.id === selectedPayment);

  const filteredPayments = safePayments.filter(payment => {
    const searchLower = searchValue.toLowerCase();
    return (
      payment.clients?.name?.toLowerCase().includes(searchLower) ||
      payment.description?.toLowerCase().includes(searchLower) ||
      payment.amount?.toString().includes(searchLower)
    );
  });

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          type="button"
          onMouseDown={handleButtonClick} // Changed to onMouseDown to ensure it fires before any form submission
          disabled={isLoading}
        >
          {isLoading ? (
            "Carregando recebimentos..."
          ) : selectedPayment && selectedPaymentData ? (
            selectedPaymentData.description || "Selecione um recebimento..."
          ) : (
            "Selecione um recebimento..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50" align="start">
        <Command>
          <CommandInput 
            placeholder="Busque por cliente, descrição ou valor..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty className="py-6 text-center text-sm">
            <p className="text-muted-foreground">
              {isLoading ? "Carregando recebimentos..." : "Nenhum recebimento encontrado"}
            </p>
          </CommandEmpty>
          {isLoading ? (
            <div className="py-6 text-center text-sm">
              <p className="text-muted-foreground">Carregando recebimentos...</p>
            </div>
          ) : (
            <CommandGroup className="max-h-[300px] overflow-auto">
              {filteredPayments.map(payment => (
                <CommandItem
                  key={payment.id}
                  value={payment.id}
                  onSelect={(value) => {
                    onSelect(value);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start"
                >
                  <div className="flex items-center w-full">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 flex-shrink-0",
                        selectedPayment === payment.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-grow">
                      <span className="font-medium">{payment.clients?.name || 'Cliente'}</span>
                      <span className="text-sm text-muted-foreground">
                        {payment.description || 'Sem descrição'} - {formatCurrency(payment.amount || 0)}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
