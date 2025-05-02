
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecurringBilling } from "@/types/billing";
import { Payment } from "@/types/payment";
import { supabase } from "@/integrations/supabase/client";
import { PaymentTable } from "../payments/PaymentTable";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";

interface RecurringBillingPaymentsDialogProps {
  open: boolean;
  onClose: () => void;
  billing: RecurringBilling;
}

export const RecurringBillingPaymentsDialog = ({
  open,
  onClose,
  billing,
}: RecurringBillingPaymentsDialogProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (open) {
      fetchPayments();
    }
  }, [open, billing.id]);
  
  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Query payments specifically for this recurring billing by looking for 
      // exact pattern in description: "Description (X/12)" where 12 is the total installments
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            id, name, responsible_name, partner_name
          )
        `)
        .eq('client_id', billing.client_id)
        .eq('total_installments', billing.installments) // Match exact number of installments
        .ilike('description', `${billing.description.split('(')[0].trim()}%`) // Match the base description
        .order('installment_number', { ascending: true });
        
      if (error) {
        console.error("Error fetching payments:", error);
        return;
      }
      
      // Additional filter to make absolutely sure we get only the relevant payments
      const filteredPayments = data?.filter(payment => {
        // Check if this payment belongs to this exact billing cycle
        // by ensuring the description pattern matches
        return payment.description.startsWith(billing.description.split('(')[0].trim()) && 
               payment.total_installments === billing.installments;
      }) || [];
      
      setPayments(filteredPayments);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchPayments();
  };
  
  const Content = () => (
    <>
      <div className="px-4 py-2">
        <h3 className="text-lg font-semibold mb-2">{billing.description}</h3>
        <p className="text-muted-foreground mb-4">Cliente: {billing.clients?.name}</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <PaymentTable 
          payments={payments} 
          onRefresh={refreshData} 
          enableDuplicate={true} 
        />
      )}
    </>
  );
  
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Parcelas do Recebimento Recorrente</DrawerTitle>
          </DrawerHeader>
          <Content />
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Parcelas do Recebimento Recorrente</DialogTitle>
        </DialogHeader>
        <Content />
      </DialogContent>
    </Dialog>
  );
};
