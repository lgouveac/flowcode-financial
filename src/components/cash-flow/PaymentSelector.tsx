
import { useState, useEffect } from "react";
import { Payment } from "@/types/payment";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PaymentSelectorProps {
  payments: Payment[] | null | undefined;
  selectedPayment: Payment | null;
  onSelect: (payment: Payment | null) => void;
}

export const PaymentSelector = ({ payments, selectedPayment, onSelect }: PaymentSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Ensure payments is always an array
  const safePayments = Array.isArray(payments) ? payments : [];

  // Debug logs
  useEffect(() => {
    console.log('PaymentSelector rendered with payments:', safePayments);
    console.log('PaymentSelector selected payment:', selectedPayment);
  }, [safePayments, selectedPayment]);

  // Filter payments based on search term
  const filteredPayments = safePayments.filter(payment => 
    payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.amount.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <Label>Pagamento</Label>
      
      <Input
        placeholder="Buscar pagamento..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />

      {safePayments.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <RadioGroup 
            value={selectedPayment?.id} 
            onValueChange={(value) => {
              const payment = safePayments.find(p => p.id === value);
              onSelect(payment || null);
            }}
            className="divide-y"
          >
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <div 
                  key={payment.id} 
                  className={cn(
                    "flex items-center px-4 py-2 hover:bg-muted cursor-pointer",
                    selectedPayment?.id === payment.id && "bg-muted"
                  )}
                  onClick={() => onSelect(payment)}
                >
                  <RadioGroupItem value={payment.id} id={payment.id} className="mr-2" />
                  <div className="flex-1">
                    <div className="font-medium">{payment.description}</div>
                    <div className="text-sm text-muted-foreground">R$ {payment.amount.toFixed(2)}</div>
                  </div>
                  {selectedPayment?.id === payment.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhum pagamento encontrado.
              </div>
            )}
          </RadioGroup>
        </div>
      ) : (
        <div className="p-4 text-center text-sm border rounded-md text-muted-foreground">
          Nenhum pagamento disponível.
        </div>
      )}
    </div>
  );
};
