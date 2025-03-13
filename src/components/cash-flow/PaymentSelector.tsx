
import { useState, useEffect } from "react";
import { Payment } from "@/types/payment";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";

interface PaymentSelectorProps {
  payments: Payment[] | null | undefined;
  selectedPayment: Payment | null;
  onSelect: (payment: Payment | null) => void;
}

export const PaymentSelector = ({ payments, selectedPayment, onSelect }: PaymentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Ensure payments is always an array
  const safePayments = Array.isArray(payments) ? payments : [];

  // Debug logs
  useEffect(() => {
    console.log('PaymentSelector rendered with payments:', safePayments);
    console.log('PaymentSelector selected payment:', selectedPayment);
  }, [safePayments, selectedPayment]);

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
            onClick={(e) => {
              e.preventDefault();
              setOpen(!open);
            }}
          >
            {selectedPayment ? 
              `${selectedPayment.description} - R$ ${selectedPayment.amount.toFixed(2)}` : 
              "Selecionar pagamento..."
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          {safePayments.length > 0 ? (
            <Command className="w-full">
              <CommandInput placeholder="Buscar pagamento..." value={searchTerm} onValueChange={setSearchTerm} />
              <CommandEmpty>Nenhum pagamento encontrado.</CommandEmpty>
              <CommandGroup>
                {safePayments.map((payment) => (
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
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum pagamento disponível.
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
