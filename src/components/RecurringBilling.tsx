
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingTable } from "./recurring-billing/BillingTable";
import { PaymentTable } from "./payments/PaymentTable";
import { NewBillingDialog } from "./recurring-billing/NewBillingDialog";
import { NotificationSettings } from "./emails/NotificationSettings";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useBillingData } from "@/hooks/useBillingData";

export const RecurringBilling = () => {
  const { billings, payments, clients, templates, fetchBillings, fetchPayments } = useBillingData();
  const [showSettings, setShowSettings] = useState(false);

  const handleSuccess = () => {
    fetchBillings();
    fetchPayments();
  };

  // Subscribe to changes from child components
  const handleRefreshData = () => {
    handleSuccess();
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Recebimentos</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <NewBillingDialog 
            clients={clients} 
            onSuccess={handleSuccess}
            templates={templates} 
          />
        </div>
      </div>

      <Tabs defaultValue="recurring" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
          <TabsTrigger value="onetime">Pontuais</TabsTrigger>
        </TabsList>
        <TabsContent value="recurring" className="border rounded-lg">
          <BillingTable billings={billings} onRefresh={handleRefreshData} />
        </TabsContent>
        <TabsContent value="onetime" className="border rounded-lg">
          <PaymentTable payments={payments} onRefresh={handleRefreshData} />
        </TabsContent>
      </Tabs>

      <NotificationSettings
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};
