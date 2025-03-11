import { useState } from "react";
import { Payment } from "@/types/payment";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";

interface PaymentSelectorProps {
  payments: Payment[];
  selectedPayment: Payment | null;
  onSelect: (payment: Payment | null) => void;
}

export const PaymentSelector = ({ payments = [], selectedPayment, onSelect }: PaymentSelectorProps) => {
  const [open, setOpen] = useState(false);

  if (!Array.isArray(payments)) {
    console.error('Payments is not an array:', payments);
    return null;
  }

  return (
    <div className="space-y-2">
      <Label>Pagamento</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedPayment ? 
              `${selectedPayment.description} - R$ ${selectedPayment.amount.toFixed(2)}` : 
              "Selecionar pagamento..."
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar pagamento..." />
            <CommandEmpty>Nenhum pagamento encontrado.</CommandEmpty>
            <CommandGroup>
              {payments.map((payment) => (
                <CommandItem
                  key={payment.id}
                  value={payment.id}
                  onSelect={() => {
                    onSelect(payment);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedPayment?.id === payment.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {payment.description} - R$ {payment.amount.toFixed(2)}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
