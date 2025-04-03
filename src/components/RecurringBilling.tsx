
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingTable } from "./recurring-billing/BillingTable";
import { PaymentTable } from "./payments/PaymentTable";
import { NewBillingDialog } from "./recurring-billing/NewBillingDialog";
import { NotificationSettings } from "./emails/NotificationSettings";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useBillingData } from "@/hooks/useBillingData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewPaymentDialog } from "./payments/NewPaymentDialog";

export const RecurringBilling = () => {
  const { billings, payments, clients, templates, fetchBillings, fetchPayments } = useBillingData();
  const [showSettings, setShowSettings] = useState(false);
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("recurring");

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

      <Tabs 
        defaultValue="recurring" 
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
          <TabsTrigger value="onetime">Pontuais</TabsTrigger>
        </TabsList>
        <TabsContent value="recurring" className="border rounded-lg">
          <BillingTable 
            billings={billings} 
            onRefresh={handleRefreshData} 
          />
        </TabsContent>
        <TabsContent value="onetime" className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recebimentos Pontuais</h2>
          </div>
          <PaymentTable 
            payments={payments} 
            onRefresh={handleRefreshData} 
          />
        </TabsContent>
      </Tabs>

      <NotificationSettings
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <NewPaymentDialog
        open={showNewPaymentDialog}
        onClose={() => setShowNewPaymentDialog(false)}
        onSuccess={handleSuccess}
        clients={clients}
        templates={templates}
      />
    </div>
  );
};
