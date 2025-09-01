import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { Search, User, Calendar, DollarSign, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: string;
}

interface ClientPaymentSummary {
  client_id: string;
  client_name: string;
  total_amount: number;
  payment_count: number;
  last_payment_date: string;
  payments: PaymentRecord[];
}

export default function PaymentsByClient() {
  const [clientSummaries, setClientSummaries] = useState<ClientPaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentData();
  }, [periodFilter]);

  const getPeriodDates = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    switch (periodFilter) {
      case 'current_month':
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
        };
      case 'last_month':
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        return {
          start: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
        };
      case 'last_3_months':
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return {
          start: threeMonthsAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        };
      default:
        return null;
    }
  };

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cash_flow')
        .select(`
          id,
          date,
          description,
          amount,
          category,
          type,
          client_id,
          clients (
            id,
            name
          )
        `)
        .eq('type', 'income')
        .not('client_id', 'is', null)
        .order('date', { ascending: false });

      // Apply period filter if selected
      const periodDates = getPeriodDates();
      if (periodDates) {
        query = query.gte('date', periodDates.start).lte('date', periodDates.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process data to group by client
      const clientMap = new Map<string, ClientPaymentSummary>();

      data?.forEach((record: any) => {
        if (!record.clients) return;

        const clientId = record.client_id;
        const clientName = record.clients.name;

        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            client_id: clientId,
            client_name: clientName,
            total_amount: 0,
            payment_count: 0,
            last_payment_date: record.date,
            payments: []
          });
        }

        const summary = clientMap.get(clientId)!;
        summary.total_amount += record.amount;
        summary.payment_count += 1;
        
        // Update last payment date if this one is more recent
        if (record.date > summary.last_payment_date) {
          summary.last_payment_date = record.date;
        }

        summary.payments.push({
          id: record.id,
          date: record.date,
          description: record.description,
          amount: record.amount,
          category: record.category,
          type: record.type
        });
      });

      // Convert to array and sort by total amount (descending)
      const sortedSummaries = Array.from(clientMap.values()).sort(
        (a, b) => b.total_amount - a.total_amount
      );

      setClientSummaries(sortedSummaries);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de pagamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSummaries = clientSummaries.filter(summary =>
    summary.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = filteredSummaries.reduce((sum, summary) => sum + summary.total_amount, 0);
  const totalClients = filteredSummaries.length;

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'current_month': return 'Mês Atual';
      case 'last_month': return 'Mês Anterior';
      case 'last_3_months': return 'Últimos 3 Meses';
      default: return 'Todo o Período';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pagamentos por Cliente</h1>
          <p className="text-muted-foreground">
            Histórico detalhado de receitas por cliente
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o Período</SelectItem>
              <SelectItem value="current_month">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Anterior</SelectItem>
              <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            )}
            <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalClients}</div>
            )}
            <p className="text-xs text-muted-foreground">Com pagamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {totalClients > 0 ? formatCurrency(totalRevenue / totalClients) : formatCurrency(0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Por cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredSummaries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `Não encontramos clientes que correspondam a "${searchTerm}"`
                  : "Não há dados de pagamentos para o período selecionado"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSummaries.map((summary) => (
            <Card key={summary.client_id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{summary.client_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{summary.payment_count} pagamento{summary.payment_count > 1 ? 's' : ''}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Último: {formatDate(new Date(summary.last_payment_date), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(summary.total_amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(summary.total_amount / summary.payment_count)} por pagamento
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleClientExpansion(summary.client_id)}
                      className="ml-2"
                    >
                      {expandedClient === summary.client_id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Payment History */}
                {expandedClient === summary.client_id && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-4">Histórico de Pagamentos</h4>
                    <div className="space-y-3">
                      {summary.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-sm">
                              <div className="font-medium">{payment.description}</div>
                              <div className="text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {formatDate(new Date(payment.date), "dd/MM/yyyy")}
                                <Badge variant="outline" className="text-xs">
                                  {payment.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="font-semibold text-green-600">
                            {formatCurrency(payment.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}