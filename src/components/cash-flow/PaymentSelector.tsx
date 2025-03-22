
import { useState, useEffect } from "react";
import { Payment } from "@/types/payment";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Check, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface PaymentSelectorProps {
  payments: Payment[] | null | undefined;
  selectedPayment: Payment | null;
  onSelect: (payment: Payment | null) => void;
  onDelete?: (paymentId: string) => Promise<void>;
}

export const PaymentSelector = ({ 
  payments, 
  selectedPayment, 
  onSelect, 
  onDelete 
}: PaymentSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Define valid statuses explicitly
  const validStatuses: ("pending" | "billed" | "awaiting_invoice")[] = ['pending', 'billed', 'awaiting_invoice'];
  
  // Only use payments with the correct status
  const safePayments = Array.isArray(payments) 
    ? payments.filter(payment => 
        payment && 
        payment.status && 
        validStatuses.includes(payment.status as any))
    : [];

  // Debug logs
  useEffect(() => {
    console.log('PaymentSelector received payments:', payments);
    console.log('Valid payment statuses:', validStatuses);
    console.log('PaymentSelector filtered payments to:', safePayments);
    console.log('Number of safe payments:', safePayments.length);
    
    // Log each payment individually for deeper inspection
    if (Array.isArray(payments)) {
      console.log('Individual payments before filtering:');
      payments.forEach((payment, index) => {
        console.log(`Payment ${index + 1}:`, { 
          id: payment?.id || 'undefined', 
          description: payment?.description || 'undefined',
          status: payment?.status || 'undefined'
        });
      });
    }
    
    console.log('Payments statuses in selector:', safePayments.map(p => p.status));
    console.log('PaymentSelector selected payment:', selectedPayment);
  }, [payments, safePayments, selectedPayment]);

  // Filter payments based on search term
  const filteredPayments = safePayments.filter(payment => 
    payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.amount.toString().includes(searchTerm)
  );

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!paymentToDelete || !onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete(paymentToDelete);
      
      // If the deleted payment was selected, deselect it
      if (selectedPayment?.id === paymentToDelete) {
        onSelect(null);
      }
      
      setPaymentToDelete(null);
    } catch (error) {
      console.error("Error deleting payment:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Handle delete click
  const handleDeleteClick = (e: React.MouseEvent, paymentId: string) => {
    e.stopPropagation(); // Prevent selection when clicking delete
    setPaymentToDelete(paymentId);
    setDeleteDialogOpen(true);
  };

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
                    <div className="text-xs text-muted-foreground">Status: {payment.status}</div>
                  </div>
                  {selectedPayment?.id === payment.id && (
                    <Check className="h-4 w-4 text-primary mr-2" />
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => handleDeleteClick(e, payment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
