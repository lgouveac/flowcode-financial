
import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react"; // Changed from @radix-ui/react-icons to lucide-react
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { PaymentRow } from "@/components/PaymentRow";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import type { Payment } from "@/types/payment";

interface CardProps {
  title: string
  description: string
  pending: number
  paid: number
  total: number
  loading: boolean
}

const data: CardProps[] = [
  {
    title: "Total de Recebimentos",
    description: "Total de recebimentos deste mês",
    pending: 34,
    paid: 12,
    total: 46,
    loading: true
  },
  {
    title: "Recebimentos Pendentes",
    description: "Total de recebimentos pendentes",
    pending: 34,
    paid: 0,
    total: 34,
    loading: true
  },
  {
    title: "Recebimentos Atrasados",
    description: "Total de recebimentos atrasados",
    pending: 10,
    paid: 0,
    total: 10,
    loading: true
  },
]

// Extend the Payment type to include the isRecurring property
interface PaymentWithRecurring extends Payment {
  isRecurring?: boolean;
}

export const Overview = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingOverdue, setLoadingOverdue] = useState(true);
  const [pendingPaymentsOpen, setPendingPaymentsOpen] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<PaymentWithRecurring[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const { toast } = useToast();

  // Function to fetch pending payments - updated to fetch both recurring and one-time payments
  const fetchPendingPayments = async () => {
    setLoadingPayments(true);
    
    try {
      // Get current date
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
      
      // First day of the current month
      const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      
      // Last day of the current month
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const lastDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`;
      
      console.log(`Fetching payments from ${firstDayOfMonth} to ${lastDayOfMonth}`);
      
      // Fetch one-time payments for the current month
      const { data: oneTimePayments, error: oneTimeError } = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name,
            email,
            partner_name
          )
        `)
        .in('status', ['pending', 'awaiting_invoice', 'billed', 'partially_paid'])
        .gte('due_date', firstDayOfMonth)
        .lte('due_date', lastDayOfMonth)
        .order('due_date', { ascending: true });
      
      if (oneTimeError) {
        throw oneTimeError;
      }
      
      // Now fetch recurring billing payments
      const { data: recurringBillings, error: recurringError } = await supabase
        .from('recurring_billing')
        .select(`
          *,
          clients (
            name,
            email,
            partner_name
          )
        `)
        .in('status', ['pending', 'awaiting_invoice', 'billed', 'partially_paid']);
        
      if (recurringError) {
        throw recurringError;
      }
      
      // Process recurring billings to find those that should have payments this month
      const recurringPayments = (recurringBillings || [])
        .filter(billing => {
          // Filter only recurring billings that should have a payment in the current month
          const billingStartDate = new Date(billing.start_date);
          const billingEndDate = billing.end_date ? new Date(billing.end_date) : null;
          
          // Check if the billing is active for the current month
          const isStarted = billingStartDate <= now;
          const isNotEnded = !billingEndDate || billingEndDate >= now;
          
          return isStarted && isNotEnded;
        })
        .map(billing => {
          // Convert the recurring billing to a payment object
          const dueDay = billing.due_day;
          const dueDate = new Date(currentYear, currentMonth - 1, dueDay);
          
          // Format the due date to ISO string
          const dueDateFormatted = dueDate.toISOString().split('T')[0];
          
          return {
            id: `recurring-${billing.id}`,
            client_id: billing.client_id,
            description: billing.description,
            amount: billing.amount,
            due_date: dueDateFormatted,
            payment_method: billing.payment_method,
            status: billing.status,
            clients: billing.clients,
            created_at: billing.created_at,
            updated_at: billing.updated_at,
            isRecurring: true
          } as PaymentWithRecurring;
        });
      
      // Debug log
      console.log('One-time payments:', oneTimePayments);
      console.log('Recurring payments:', recurringPayments);
      
      // Combine both payment types
      const allPendingPayments = [
        ...(oneTimePayments || []).map(p => ({ ...p, isRecurring: false })), 
        ...recurringPayments
      ];
      
      // Sort by due date
      allPendingPayments.sort((a, b) => {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
      
      setPendingPayments(allPendingPayments);
      
      // Log data to help with debugging
      console.log('All pending payments:', allPendingPayments);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchTotalRevenue = async () => {
    setLoadingRevenue(true);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JS months are 0-indexed

      const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const lastDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`;

      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      if (error) {
        throw error;
      }

      const total = data?.reduce((acc, item) => acc + item.amount, 0) || 0;
      setTotalRevenue(total);
    } catch (error) {
      console.error("Error fetching total revenue:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o total de receita.",
        variant: "destructive",
      });
    } finally {
      setLoadingRevenue(false);
    }
  };

  const fetchTotalPending = async () => {
    setLoadingPending(true);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JS months are 0-indexed

      const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const lastDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`;

      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .in('status', ['pending', 'awaiting_invoice', 'billed', 'partially_paid'])
        .gte('due_date', firstDayOfMonth)
        .lte('due_date', lastDayOfMonth);

      if (error) {
        throw error;
      }

      const total = data?.reduce((acc, item) => acc + item.amount, 0) || 0;
      setTotalPending(total);
    } catch (error) {
      console.error("Error fetching total pending:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o total de pendentes.",
        variant: "destructive",
      });
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchTotalOverdue = async () => {
    setLoadingOverdue(true);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JS months are 0-indexed

      const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const lastDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`;

      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'overdue')
        .gte('due_date', firstDayOfMonth)
        .lte('due_date', lastDayOfMonth);

      if (error) {
        throw error;
      }

      const total = data?.reduce((acc, item) => acc + item.amount, 0) || 0;
      setTotalOverdue(total);
    } catch (error) {
      console.error("Error fetching total overdue:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o total de atrasados.",
        variant: "destructive",
      });
    } finally {
      setLoadingOverdue(false);
    }
  };

  useEffect(() => {
    fetchTotalRevenue();
    fetchTotalPending();
    fetchTotalOverdue();
  }, []);

  const primaryStats = [
    {
      title: "Total de Recebimentos",
      description: "Total de recebimentos deste mês",
      value: formatCurrency(totalRevenue),
      loading: loadingRevenue,
    },
    {
      title: "Recebimentos Pendentes",
      description: "Total de recebimentos pendentes",
      value: formatCurrency(totalPending),
      loading: loadingPending,
    },
    {
      title: "Recebimentos Atrasados",
      description: "Total de recebimentos atrasados",
      value: formatCurrency(totalOverdue),
      loading: loadingOverdue,
    },
  ];
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral da sua empresa. Atualizado em tempo real.
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "MMMM yyyy", { locale: ptBR }) : <span>Selecionar mês</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              locale={ptBR}
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </PopoverContent>
        </Popover>
      </div>
      <Separator />
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        {primaryStats.map((card, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {card.loading ? (
                <Skeleton className="h-10 w-40" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
            <CardDescription>
              Gráfico de receita e despesas dos últimos meses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>

      <Button onClick={() => {
        fetchPendingPayments();
        setPendingPaymentsOpen(true);
      }}>
        Mostrar Recebimentos Pendentes
      </Button>

      {/* Pending Payments Modal */}
      <Dialog open={pendingPaymentsOpen} onOpenChange={setPendingPaymentsOpen}>
        <DialogContent className="w-full max-w-4xl">
          <DialogHeader>
            <DialogTitle>Recebimentos Pendentes - Mês Atual</DialogTitle>
            <DialogDescription>
              Todos os recebimentos pendentes para o mês atual, incluindo recorrentes e pontuais.
            </DialogDescription>
          </DialogHeader>
          
          {loadingPayments ? (
            <div className="flex justify-center py-8">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum recebimento pendente encontrado para este mês.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr className="text-left">
                        <th className="p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Descrição</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Valor</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Vencimento</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Método</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayments.map((payment) => (
                        <PaymentRow 
                          key={payment.id}
                          payment={payment} 
                          onEmailSent={() => fetchPendingPayments()}
                          onPaymentUpdated={() => fetchPendingPayments()}
                          enableDuplicate={false}
                          templates={[]}
                          isRecurring={payment.isRecurring}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
