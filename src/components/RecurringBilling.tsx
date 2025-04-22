
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingTable } from "./recurring-billing/BillingTable";
import { PaymentTable } from "./payments/PaymentTable";
import { NewBillingDialog } from "./recurring-billing/NewBillingDialog";
import { NotificationSettings } from "./emails/NotificationSettings";
import { Search, Settings, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { useBillingData } from "@/hooks/useBillingData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewPaymentDialog } from "./payments/NewPaymentDialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export const RecurringBilling = () => {
  const { billings, payments, clients, templates, fetchBillings, fetchPayments } = useBillingData();
  const [showSettings, setShowSettings] = useState(false);
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("recurring");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [billingSearch, setBillingSearch] = useState("");
  const [billingStatusFilter, setBillingStatusFilter] = useState("all");

  const handleSuccess = () => {
    fetchBillings();
    fetchPayments();
  };

  // Recorrentes filtrados como pontuais
  const filteredBillings = useMemo(() => {
    return billings.filter(billing => {
      const client = billing.client?.name || "";
      const description = billing.description.toLowerCase();
      const search = billingSearch.toLowerCase();
      const matchesSearch = client.toLowerCase().includes(search) || description.includes(search);
      const matchesStatus = billingStatusFilter === "all" || billing.status === billingStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [billings, billingSearch, billingStatusFilter]);

  // Only show one-time payments in the "Pontuais" tab
  const oneTimePayments = payments.filter(payment => 
    payment.installment_number === null || payment.installment_number === undefined
  );

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
          {/* Busca e filtro iguais aos pontuais */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4 pt-4 px-4">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por cliente ou descrição..."
                value={billingSearch}
                onChange={(e) => setBillingSearch(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select
                value={billingStatusFilter}
                onValueChange={(value) => setBillingStatusFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <BillingTable 
            billings={filteredBillings}
            onRefresh={handleSuccess}
            enableDuplicate // prop para habilitar duplicar (usar em BillingTable)
          />
        </TabsContent>

        <TabsContent value="onetime" className="border rounded-lg">
          <div className="flex justify-between items-center mb-4 pt-4 px-4">
            <h2 className="text-lg font-medium">Recebimentos Pontuais</h2>
            <Button onClick={() => setShowNewPaymentDialog(true)}>
              Novo Recebimento Pontual
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-4 px-4">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por cliente ou descrição..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select
                value={paymentStatusFilter}
                onValueChange={(value) => setPaymentStatusFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Removido botão duplicado */}
          <PaymentTable 
            payments={oneTimePayments} 
            onRefresh={handleSuccess}
            searchTerm={paymentSearch}
            statusFilter={paymentStatusFilter}
            enableDuplicate // nova prop para permitir duplicar
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

