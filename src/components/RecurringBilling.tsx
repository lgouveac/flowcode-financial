import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingTable } from "./recurring-billing/BillingTable";
import { PaymentTable } from "./payments/PaymentTable";
import { NotificationSettings } from "./emails/NotificationSettings";
import { Search, SlidersHorizontal } from "lucide-react";
import { useBillingData } from "@/hooks/useBillingData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { SimplePaymentDialog } from "./recurring-billing/SimplePaymentDialog";
import { Skeleton } from "./ui/skeleton";
export const RecurringBilling = () => {
  const {
    billings,
    payments,
    clients,
    templates,
    isLoading,
    fetchBillings,
    fetchPayments
  } = useBillingData();
  const [showSettings, setShowSettings] = useState(false);
  const [showSimplePaymentDialog, setShowSimplePaymentDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("recurring");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [billingSearch, setBillingSearch] = useState("");
  const [billingStatusFilter, setBillingStatusFilter] = useState("all");
  const handleSuccess = () => {
    fetchBillings();
    fetchPayments();
    toast({
      title: "Sucesso",
      description: "Operação realizada com sucesso"
    });
  };

  // Filtragem de cobranças recorrentes
  const filteredBillings = useMemo(() => {
    if (!billings || !Array.isArray(billings)) return [];
    return billings.filter(billing => {
      const client = billing.clients?.name || "";
      const description = (billing.description || "").toLowerCase();
      const search = billingSearch.toLowerCase();
      const matchesSearch = client.toLowerCase().includes(search) || description.includes(search);
      const matchesStatus = billingStatusFilter === "all" || billing.status === billingStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [billings, billingSearch, billingStatusFilter]);

  // Filtragem de pagamentos pontuais - garantindo que são APENAS pagamentos NÃO relacionados a cobranças recorrentes
  const oneTimePayments = useMemo(() => {
    if (!payments || !Array.isArray(payments)) return [];

    // Só incluir pagamentos que são realmente pontuais (não são parcelas de recorrentes)
    return payments.filter(payment => {
      // Verificamos que o pagamento não tem número de parcela (installment_number)
      // e não possui o prefixo "recurring-" no ID (que é usado para pagamentos de cobranças recorrentes)
      return (payment.installment_number === null || payment.installment_number === undefined) && typeof payment.id === 'string' && !payment.id.startsWith('recurring-');
    });
  }, [payments]);

  // Garante que clients e templates são sempre arrays
  const safeClients = Array.isArray(clients) ? clients.filter(client => client && typeof client === 'object' && client.id && client.name) : [];
  const safeTemplates = Array.isArray(templates) ? templates : [];
  if (isLoading) {
    return <div className="space-y-8 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Recebimentos</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>;
  }
  return <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Recebimentos</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowSimplePaymentDialog(true)}>
            Novo Recebimento
          </Button>
        </div>
      </div>

      <Tabs defaultValue="recurring" className="w-full" onValueChange={value => setActiveTab(value)}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
          <TabsTrigger value="onetime">Pontuais</TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="border border-0 ">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 pt-4 px-4">
            <div className="flex flex-1 flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input placeholder="Buscar por cliente ou descrição..." value={billingSearch} onChange={e => setBillingSearch(e.target.value)} className="pl-9" />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select value={billingStatusFilter} onValueChange={value => setBillingStatusFilter(value)}>
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
          </div>
          <BillingTable billings={filteredBillings} onRefresh={handleSuccess} enableDuplicate templates={safeTemplates} />
        </TabsContent>

        <TabsContent value="onetime" className="border rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 pt-4 px-4">
            <div className="flex flex-1 flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input placeholder="Buscar por cliente ou descrição..." value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)} className="pl-9" />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select value={paymentStatusFilter} onValueChange={value => setPaymentStatusFilter(value)}>
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
          </div>
          <PaymentTable payments={oneTimePayments} onRefresh={handleSuccess} searchTerm={paymentSearch} statusFilter={paymentStatusFilter} templates={safeTemplates} enableDuplicate={true} />
        </TabsContent>
      </Tabs>

      <NotificationSettings open={showSettings} onClose={() => setShowSettings(false)} />

      <SimplePaymentDialog open={showSimplePaymentDialog} onClose={() => setShowSimplePaymentDialog(false)} onSuccess={handleSuccess} clients={safeClients} />
    </div>;
};