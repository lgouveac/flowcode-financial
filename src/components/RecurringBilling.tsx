
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingTable } from "./recurring-billing/BillingTable";
import { PaymentTable } from "./payments/PaymentTable";
import { NewBillingDialog } from "./recurring-billing/NewBillingDialog";
import { useBillingData } from "@/hooks/useBillingData";

export const RecurringBilling = () => {
  const { billings, payments, clients, templates, fetchBillings, fetchPayments } = useBillingData();

  const handleSuccess = () => {
    fetchBillings();
    fetchPayments();
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Recebimentos</h1>
        <NewBillingDialog 
          clients={clients} 
          onSuccess={handleSuccess}
          templates={templates} 
        />
      </div>

      <Tabs defaultValue="recurring" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
          <TabsTrigger value="onetime">Pontuais</TabsTrigger>
        </TabsList>
        <TabsContent value="recurring">
          <BillingTable billings={billings} />
        </TabsContent>
        <TabsContent value="onetime">
          <PaymentTable payments={payments} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

