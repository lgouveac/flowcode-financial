
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
}

export const PaymentSelector = ({ payments, selectedPayment, onSelect }: PaymentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchValue.toLowerCase();
    return (
      payment.clients.name.toLowerCase().includes(searchLower) ||
      payment.description.toLowerCase().includes(searchLower) ||
      payment.amount.toString().includes(searchLower)
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedPayment ? (
            payments.find((payment) => payment.id === selectedPayment)?.description
          ) : (
            "Selecione um recebimento..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="rounded-lg border bg-white shadow-md">
          <CommandInput 
            placeholder="Busque por cliente, descrição ou valor..." 
            value={searchValue}
            onValueChange={setSearchValue}
            className="bg-white"
          />
          <CommandEmpty className="border-t bg-white">
            <div className="p-6 text-center">
              <p className="text-base text-muted-foreground">
                Nenhum recebimento encontrado
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tente buscar usando outros termos ou verifique se existem recebimentos pendentes
              </p>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto bg-white">
            {filteredPayments.map(payment => (
              <CommandItem
                key={payment.id}
                value={payment.id}
                onSelect={() => {
                  onSelect(payment.id);
                  setOpen(false);
                }}
                className="bg-white hover:bg-accent"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedPayment === payment.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{payment.clients.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {payment.description} - {formatCurrency(payment.amount)}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
