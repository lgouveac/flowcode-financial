import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingTable } from "./recurring-billing/BillingTable";
import { PaymentTable } from "./payments/PaymentTable";
import { NotificationSettings } from "./emails/NotificationSettings";
import { Search, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { useBillingData } from "@/hooks/useBillingData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { SimplePaymentDialog } from "./recurring-billing/SimplePaymentDialog";
import { Skeleton } from "./ui/skeleton";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  const [activeTab, setActiveTab] = useState("all");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all"); // Todos por padrão
  const [billingSearch, setBillingSearch] = useState("");
  const [allSearch, setAllSearch] = useState(""); // Campo de busca para a aba "Todos"
  const [billingStatusFilter, setBillingStatusFilter] = useState("all"); // Todos por padrão no escopo aberto
  const [showPaymentDelivery, setShowPaymentDelivery] = useState(false); // Mostrar pagamentos por entrega - escopo fechado
  const [showBillingDelivery, setShowBillingDelivery] = useState(false); // Mostrar pagamentos por entrega - escopo aberto
  const [showAllDelivery, setShowAllDelivery] = useState(false); // Mostrar pagamentos por entrega - aba todos
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true); // Filtros expandidos por padrão no escopo fechado
  const [showAdvancedFiltersOpen, setShowAdvancedFiltersOpen] = useState(true); // Filtros expandidos por padrão no escopo aberto
  const [expandCharges, setExpandCharges] = useState(true); // Expandido por padrão
  const [expandChargesOpen, setExpandChargesOpen] = useState(true);
  const [expandChargesAll, setExpandChargesAll] = useState(true); // Expandido por padrão na aba Todos
  const [sortBy, setSortBy] = useState("due_date"); // Vencimento próximo por padrão
  const [sortByOpen, setSortByOpen] = useState("due_date"); // Vencimento próximo por padrão no escopo aberto
  const [paymentStatusDetailFilter, setPaymentStatusDetailFilter] = useState<string[]>(["pending", "overdue"]); // Pendente e atrasado por padrão
  const [billingStatusDetailFilter, setBillingStatusDetailFilter] = useState<string[]>(["pending", "overdue"]); // Pendente e atrasado por padrão no escopo aberto
  const [allStatusDetailFilter, setAllStatusDetailFilter] = useState<string[]>(["pending", "overdue"]); // Filtro específico para aba "Todos"
  const [showStatusFilterModal, setShowStatusFilterModal] = useState(false);
  const [currentFilterType, setCurrentFilterType] = useState<'payment' | 'billing' | 'all'>('payment');

  // Função helper para toggle de status nos arrays
  const toggleStatusInArray = (statusArray: string[], status: string, setter: (array: string[]) => void) => {
    if (status === "all") {
      setter(["all"]);
    } else {
      let newArray = statusArray.filter(s => s !== "all"); // Remove "all" se existir
      if (newArray.includes(status)) {
        newArray = newArray.filter(s => s !== status);
      } else {
        newArray = [...newArray, status];
      }
      // Se array ficar vazio, adiciona "all"
      if (newArray.length === 0) {
        newArray = ["all"];
      }
      setter(newArray);
    }
  };

  // Função para ajustar filtros quando muda entre expandido/agrupado
  const adjustFiltersForMode = (statusArray: string[], isExpanded: boolean, filterType: 'payment' | 'billing') => {
    const availableValues = getStatusOptions(isExpanded, filterType).map(opt => opt.value);
    const validStatuses = statusArray.filter(status => availableValues.includes(status));
    
    // Se não há status válidos, volta para "all"
    if (validStatuses.length === 0) {
      return ["all"];
    }
    
    return validStatuses;
  };

  // Funções helper para a modal de filtro de status
  const openStatusFilterModal = (type: 'payment' | 'billing' | 'all') => {
    setCurrentFilterType(type);
    setShowStatusFilterModal(true);
  };

  const getCurrentStatusArray = () => {
    return currentFilterType === 'payment' ? paymentStatusDetailFilter :
           currentFilterType === 'billing' ? billingStatusDetailFilter :
           allStatusDetailFilter;
  };

  const getCurrentStatusSetter = () => {
    return currentFilterType === 'payment' ? setPaymentStatusDetailFilter :
           currentFilterType === 'billing' ? setBillingStatusDetailFilter :
           setAllStatusDetailFilter;
  };

  const getStatusDisplayText = (statusArray: string[], isExpanded: boolean, filterType: 'payment' | 'billing') => {
    if (statusArray.includes("all")) {
      return "Todos os status";
    }
    if (statusArray.length === 1) {
      const statusLabels: Record<string, string> = isExpanded ? {
        // Labels para modo expandido
        pending: "Pendente",
        paid: "Pago", 
        overdue: "Atrasado",
        cancelled: "Cancelado",
        billed: "Faturado",
        awaiting_invoice: "Aguardando NF",
        partially_paid: "Parc. Pago"
      } : {
        // Labels para modo agrupado
        pending: "Ativo",
        cancelled: "Inativo"
      };
      return statusLabels[statusArray[0]] || statusArray[0];
    }
    return `${statusArray.length} status selecionados`;
  };

  // Opções de status baseadas no contexto (agrupado vs expandido)
  const getStatusOptions = (isExpanded: boolean, filterType: 'payment' | 'billing') => {
    const baseOption = { value: "all", label: "Todos" };
    
    if (isExpanded) {
      // Quando expandido: mostrar status reais dos pagamentos
      return [
        baseOption,
        { value: "pending", label: "Pendente" },
        { value: "paid", label: "Pago" },
        { value: "overdue", label: "Atrasado" },
        { value: "cancelled", label: "Cancelado" },
        { value: "billed", label: "Faturado" },
        { value: "awaiting_invoice", label: "Aguardando NF" },
        { value: "partially_paid", label: "Parc. Pago" }
      ];
    } else {
      // Quando agrupado: mostrar apenas ativo/inativo
      if (filterType === 'billing') {
        return [
          baseOption,
          { value: "pending", label: "Ativo" },
          { value: "cancelled", label: "Inativo" }
        ];
      } else {
        return [
          baseOption,
          { value: "pending", label: "Ativo" },
          { value: "cancelled", label: "Inativo" }
        ];
      }
    }
  };

  // Effect para ajustar filtros quando muda estado de expansão
  useEffect(() => {
    const adjustedPaymentFilters = adjustFiltersForMode(paymentStatusDetailFilter, expandCharges, 'payment');
    const adjustedBillingFilters = adjustFiltersForMode(billingStatusDetailFilter, expandChargesOpen, 'billing');
    const adjustedAllFilters = adjustFiltersForMode(allStatusDetailFilter, expandChargesAll, 'payment');

    if (JSON.stringify(adjustedPaymentFilters) !== JSON.stringify(paymentStatusDetailFilter)) {
      setPaymentStatusDetailFilter(adjustedPaymentFilters);
    }

    if (JSON.stringify(adjustedBillingFilters) !== JSON.stringify(billingStatusDetailFilter)) {
      setBillingStatusDetailFilter(adjustedBillingFilters);
    }

    if (JSON.stringify(adjustedAllFilters) !== JSON.stringify(allStatusDetailFilter)) {
      setAllStatusDetailFilter(adjustedAllFilters);
    }
  }, [expandCharges, expandChargesOpen, expandChargesAll]);

  const handleSuccess = () => {
    fetchBillings();
    fetchPayments();
    // Toast is handled by the component that triggered the action
  };

  // Agrupar pagamentos de escopo aberto em "billings virtuais" 
  const openScopeBillings = useMemo(() => {
    if (!billings || !Array.isArray(billings)) return [];

    // Agrupar por cliente e descrição base
    const groups: { [key: string]: any[] } = {};
    
    billings.forEach(payment => {
      // Criar chave única por cliente e descrição base (sem número de parcela)
      const baseDescription = payment.description?.replace(/\s*\(\d+\/\d+\).*$/, '') || payment.description;
      const groupKey = `${payment.client_id}-${baseDescription}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(payment);
    });

    // Converter grupos em "billings virtuais"
    return Object.values(groups).map(groupPayments => {
      const firstPayment = groupPayments[0];
      const sortedPayments = groupPayments.sort((a, b) => 
        (a.current_installment || 1) - (b.current_installment || 1)
      );
      
      // Calcular valor da parcela (assumindo que todas as parcelas têm o mesmo valor)
      const installmentAmount = firstPayment.amount;
      
      // Calcular parcela atual baseada na maior parcela pendente
      const maxInstallment = Math.max(...groupPayments.map(p => p.current_installment || 1));
      const totalInstallments = Math.max(...groupPayments.map(p => p.installments || 1));
      
      // Determinar status geral
      const hasCancelled = groupPayments.some(p => p.status === 'cancelled');
      const generalStatus = hasCancelled ? 'cancelled' : 'pending';

      return {
        id: firstPayment.id,
        client_id: firstPayment.client_id,
        clients: firstPayment.clients,
        description: firstPayment.description?.replace(/\s*\(\d+\/\d+\).*$/, '') || firstPayment.description,
        amount: installmentAmount,
        due_day: firstPayment.due_day,
        payment_method: firstPayment.payment_method,
        start_date: firstPayment.start_date,
        end_date: firstPayment.end_date,
        status: generalStatus,
        installments: totalInstallments,
        current_installment: maxInstallment,
        email_template: firstPayment.email_template,
        // Adicionar os pagamentos relacionados para o modal
        related_payments: groupPayments
      };
    });
  }, [billings]);

  // Filtragem de cobranças recorrentes (Escopo Aberto)
  const filteredBillings = useMemo(() => {
    if (!openScopeBillings || !Array.isArray(openScopeBillings)) return [];
    return openScopeBillings.filter(billing => {
      const client = billing.clients?.name || "";
      const description = (billing.description || "").toLowerCase();
      const search = billingSearch.toLowerCase();
      const matchesSearch = search === "" || client.toLowerCase().includes(search) || description.includes(search);
      const matchesStatus = billingStatusFilter === "all" || billing.status === billingStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [openScopeBillings, billingSearch, billingStatusFilter]);

  // Agrupar pagamentos de escopo fechado em "billings virtuais" para usar o mesmo componente
  const closedScopeBillings = useMemo(() => {
    if (!payments || !Array.isArray(payments)) return [];

    // Criar set de clientes que têm cobrança no escopo aberto
    const openScopeClients = new Set(
      billings
        ?.filter(billing => billing.status !== 'cancelled') // Apenas cobranças ativas do escopo aberto
        .map(billing => billing.client_id) || []
    );

    // Filtrar pagamentos de escopo fechado, EXCLUINDO clientes com cobrança do escopo aberto ativa
    const closedPayments = payments.filter(payment => {
      // E o cliente NÃO deve ter cobrança do escopo aberto ativa
      const clientNotInOpenScope = !openScopeClients.has(payment.client_id);
      
      return clientNotInOpenScope;
    });

    // Agrupar apenas por cliente
    const groups: { [key: string]: any[] } = {};
    
    closedPayments.forEach(payment => {
      const groupKey = payment.client_id;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(payment);
    });

    // Converter grupos em "billings virtuais"
    return Object.values(groups).map(groupPayments => {
      const firstPayment = groupPayments[0];
      const sortedPayments = groupPayments.sort((a, b) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
      
      // Calcular valor total de todos os recebimentos do cliente
      const totalAmount = groupPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Calcular parcela atual baseada nos pagamentos "paid"
      const paidCount = groupPayments.filter(p => p.status === 'paid').length;
      
      // Descrição genérica para o cliente
      const clientName = firstPayment.clients?.name || 'Cliente';

      // Determinar status geral (apenas Ativo/Inativo para escopo fechado)
      // Só considerar inativo se TODAS as parcelas estiverem canceladas
      const allAreCancelled = groupPayments.every(p => p.status === 'cancelled');
      const generalStatus = allAreCancelled ? 'cancelled' : 'pending';
      
      
      const description = `Recebimentos - ${clientName}`;

      return {
        id: `closed-${firstPayment.client_id}-${Date.now()}-${Math.random()}`,
        client_id: firstPayment.client_id,
        clients: firstPayment.clients,
        description: description, // Descrição genérica do cliente
        amount: totalAmount, // Valor total de todos os recebimentos do cliente
        due_day: new Date(sortedPayments[0].due_date).getDate(),
        payment_method: firstPayment.payment_method,
        start_date: sortedPayments[0].due_date,
        end_date: sortedPayments[sortedPayments.length - 1]?.due_date || null,
        status: generalStatus,
        installments: groupPayments.length,
        current_installment: paidCount,
        email_template: firstPayment.email_template,
        // Adicionar os pagamentos relacionados para o modal
        related_payments: groupPayments
      };
    });
  }, [payments, billings]);

  // Função para expandir cobranças (mostrar individualmente) ou manter agrupadas
  const finalClosedScopeBillings = useMemo(() => {
    if (!expandCharges) {
      return closedScopeBillings; // Agrupadas por cliente
    }

    // Expandir: mostrar cada pagamento como uma linha individual
    const allPayments = payments?.filter(payment => {
      return typeof payment.id === 'string' && !payment.id.startsWith('recurring-');
    }) || [];

    // Filtrar clientes que não têm cobrança recorrente ativa
    const activeRecurringClients = new Set(
      billings?.filter(billing => billing.status !== 'cancelled').map(billing => billing.client_id) || []
    );

    return allPayments
      .filter(payment => !activeRecurringClients.has(payment.client_id))
      .map(payment => {
        // Formatar data de vencimento
        const formattedDueDate = payment.due_date 
          ? format(parseISO(payment.due_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
          : 'Dia --';

        return {
          id: `expanded-${payment.id}`,
          client_id: payment.client_id,
          clients: payment.clients,
          description: payment.description,
          amount: payment.amount,
          due_day: formattedDueDate, // Usar data formatada
          payment_method: payment.payment_method,
          start_date: payment.due_date,
          end_date: payment.due_date,
          status: payment.status, // Usar status real do pagamento
          installments: 1,
          current_installment: payment.status === 'paid' ? 1 : 0,
          email_template: payment.email_template,
          // Marcar como pagamento individual para o modal
          individual_payment: payment
        };
      });
  }, [closedScopeBillings, expandCharges, payments, billings]);

  // Aplicar filtro por status de pagamento específico
  // Aplicar busca por texto nos payments (escopo fechado)
  const filteredPayments = useMemo(() => {
    if (!finalClosedScopeBillings || !Array.isArray(finalClosedScopeBillings)) return [];
    return finalClosedScopeBillings.filter(billing => {
      const client = billing.clients?.name || "";
      const description = (billing.description || "").toLowerCase();
      const search = paymentSearch.toLowerCase();
      const matchesSearch = client.toLowerCase().includes(search) || description.includes(search);
      return matchesSearch;
    });
  }, [finalClosedScopeBillings, paymentSearch]);

  const filteredByPaymentStatus = useMemo(() => {
    let result = filteredPayments;
    
    // Aplicar filtro de status
    if (!paymentStatusDetailFilter.includes("all")) {
      result = result.filter(billing => {
        if (billing.individual_payment) {
          // Para pagamento expandido: filtrar pelo status real
          return paymentStatusDetailFilter.includes(billing.individual_payment.status);
        } else if (billing.related_payments) {
          // Para billing agrupado: verificar se algum pagamento tem o status
          return billing.related_payments.some(payment => paymentStatusDetailFilter.includes(payment.status));
        }
        return true;
      });
    }
    
    // Aplicar filtro de pagamento por entrega
    if (showPaymentDelivery) {
      result = result.filter(billing => {
        if (billing.individual_payment) {
          return Boolean(billing.individual_payment.Pagamento_Por_Entrega);
        } else if (billing.related_payments) {
          return billing.related_payments.some(payment => Boolean(payment.Pagamento_Por_Entrega));
        }
        return false;
      });
    }
    
    return result;
  }, [filteredPayments, paymentStatusDetailFilter, showPaymentDelivery]);

  // Aplicar ordenação
  const sortedClosedScopeBillings = useMemo(() => {
    if (sortBy === "due_date") {
      return [...filteredByPaymentStatus].sort((a, b) => {
        const dateA = new Date(a.start_date);
        const dateB = new Date(b.start_date);
        return dateA.getTime() - dateB.getTime();
      });
    }
    return filteredByPaymentStatus;
  }, [filteredByPaymentStatus, sortBy]);

  // Lógica similar para o Escopo Aberto - usar a mesma abordagem do escopo fechado
  const finalOpenScopeBillings = useMemo(() => {
    if (!expandChargesOpen) {
      return filteredBillings; // Agrupadas normalmente
    }

    // Expandir: mostrar cada pagamento como uma linha individual
    // No escopo aberto, os billings JÁ SÃO os payments com scope_type = 'open'
    // Então, para expandir, usamos diretamente os billings (que são os payments do escopo aberto)
    const allOpenPayments = billings || [];

    return allOpenPayments
      .filter(payment => {
        // Aplicar filtro de busca também aos dados expandidos
        const client = payment.clients?.name || "";
        const description = (payment.description || "").toLowerCase();
        const search = billingSearch.toLowerCase();
        const matchesSearch = search === "" || client.toLowerCase().includes(search) || description.includes(search);
        const matchesStatus = billingStatusFilter === "all" || payment.status === billingStatusFilter;
        const matchesDelivery = !showBillingDelivery || Boolean(payment.Pagamento_Por_Entrega);
        return matchesSearch && matchesStatus && matchesDelivery;
      })
      .map(payment => {
        // Formatar data de vencimento
        const formattedDueDate = payment.due_date
          ? format(parseISO(payment.due_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
          : 'Dia --';

        return {
          id: `expanded-open-${payment.id}`,
          client_id: payment.client_id,
          clients: payment.clients,
          description: payment.description,
          amount: payment.amount,
          due_day: formattedDueDate,
          payment_method: payment.payment_method,
          start_date: payment.due_date,
          end_date: payment.due_date,
          status: payment.status,
          installments: 1,
          current_installment: payment.status === 'paid' ? 1 : 0,
          email_template: payment.email_template,
          // Marcar como pagamento individual para o modal
          individual_payment: payment
        };
      });
  }, [filteredBillings, expandChargesOpen, billings, billingSearch, billingStatusFilter, billingDeliveryFilter]);

  // Aplicar filtro por status específico no Escopo Aberto  
  const filteredByBillingStatus = useMemo(() => {
    let result = finalOpenScopeBillings;
    
    // Aplicar filtro de status
    if (!billingStatusDetailFilter.includes("all")) {
      result = result.filter(billing => {
        if (billing.individual_payment) {
          // Para pagamento expandido: filtrar pelo status real do pagamento
          return billingStatusDetailFilter.includes(billing.individual_payment.status);
        } else if (billing.is_virtual) {
        // Para parcelas virtuais: filtrar pelo status da parcela virtual
        return billingStatusDetailFilter.includes(billing.status);
      } else {
        // Para billing agrupado: usar o status do próprio billing
        return billingStatusDetailFilter.includes(billing.status);
      }
    });
    }
    
    // Aplicar filtro de pagamento por entrega
    if (showBillingDelivery) {
      result = result.filter(billing => {
        if (billing.individual_payment) {
          return Boolean(billing.individual_payment.Pagamento_Por_Entrega);
        }
        return false;
      });
    }
    
    return result;
  }, [finalOpenScopeBillings, billingStatusDetailFilter, showBillingDelivery]);

  // Aplicar ordenação no Escopo Aberto
  const sortedOpenScopeBillings = useMemo(() => {
    if (sortByOpen === "due_date") {
      return [...filteredByBillingStatus].sort((a, b) => {
        const dateA = new Date(a.start_date);
        const dateB = new Date(b.start_date);
        return dateA.getTime() - dateB.getTime();
      });
    }
    return filteredByBillingStatus;
  }, [filteredByBillingStatus, sortByOpen]);

  // Combinar dados de ambos os escopos para a aba "Todos" (sempre usar dados não filtrados)
  const allCombinedBillings = useMemo(() => {
    // Para a aba "Todos", usar dados processados com formatação adequada baseada no estado de expansão
    const openScopeSource = expandChargesAll ? finalOpenScopeBillings : openScopeBillings;
    const closedScopeSource = expandChargesAll ? finalClosedScopeBillings : closedScopeBillings;
    
    const openScopeData = openScopeSource.map(billing => ({
      ...billing,
      scope_type: 'open' as const,
      id: `open-${billing.id}`
    }));
    
    const closedScopeData = closedScopeSource.map(billing => ({
      ...billing,
      scope_type: 'closed' as const,
      id: `closed-${billing.id}`
    }));

    return [...openScopeData, ...closedScopeData].sort((a, b) => {
      const dateA = new Date(a.start_date || '');
      const dateB = new Date(b.start_date || '');
      return dateA.getTime() - dateB.getTime();
    });
  }, [openScopeBillings, closedScopeBillings, finalOpenScopeBillings, finalClosedScopeBillings, expandChargesAll]);

  // Aplicar filtros de busca e status para a aba "Todos"
  const filteredAllCombinedBillings = useMemo(() => {
    if (activeTab !== 'all') return allCombinedBillings;
    
    // Para a aba "Todos", aplicar filtros baseados no estado de expansão
    let result = allCombinedBillings.filter(billing => {
      // Aplicar filtro de busca por texto
      const client = billing.clients?.name || "";
      const description = (billing.description || "").toLowerCase();
      const search = allSearch.toLowerCase(); // Na aba "Todos", usar campo de busca específico
      const matchesSearch = client.toLowerCase().includes(search) || description.includes(search);
      
      if (!matchesSearch) return false;
      
      if (expandChargesAll) {
        // Quando expandido: usar o filtro específico da aba "Todos"
        if (billing.individual_payment) {
          return allStatusDetailFilter.includes("all") || allStatusDetailFilter.includes(billing.individual_payment.status);
        } else if (billing.related_payments) {
          return allStatusDetailFilter.includes("all") || billing.related_payments.some(payment => allStatusDetailFilter.includes(payment.status));
        } else {
          return allStatusDetailFilter.includes("all") || allStatusDetailFilter.includes(billing.status);
        }
      } else {
        // Quando agrupado: usar o filtro específico da aba "Todos"
        if (billing.related_payments) {
          return allStatusDetailFilter.includes("all") || billing.related_payments.some(payment => allStatusDetailFilter.includes(payment.status));
        } else {
          return allStatusDetailFilter.includes("all") || allStatusDetailFilter.includes(billing.status);
        }
      }
    });
    
    // Aplicar filtro de pagamento por entrega
    if (showAllDelivery) {
      result = result.filter(billing => {
        if (billing.individual_payment) {
          return Boolean(billing.individual_payment.Pagamento_Por_Entrega);
        } else if (billing.related_payments) {
          return billing.related_payments.some(payment => Boolean(payment.Pagamento_Por_Entrega));
        }
        return false;
      });
    }
    
    return result;
  }, [allCombinedBillings, activeTab, expandChargesAll, allStatusDetailFilter, allSearch, showAllDelivery]);

  // Garante que clients e templates são sempre arrays
  const safeClients = Array.isArray(clients) ? clients.filter(client => client && typeof client === 'object' && client.id && client.name) : [];
  const safeTemplates = Array.isArray(templates) ? templates : [];
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Recebimentos</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recebimentos</h1>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={value => setActiveTab(value)}>
        {/* Header com Tabs + Filtros + Novo Recebimento na mesma linha */}
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="recurring">Escopo Aberto</TabsTrigger>
            <TabsTrigger value="onetime">Escopo Fechado</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            <Button onClick={() => setShowSimplePaymentDialog(true)}>
              Novo Recebimento
            </Button>
          </div>
        </div>

        {/* Barra de busca e filtros (colapsável) */}
        {showAdvancedFilters && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-4 mt-4">
            <div className="relative">
              <Input 
                placeholder="Buscar por cliente ou descrição..." 
                value={activeTab === "recurring" ? billingSearch : (activeTab === "all" ? allSearch : paymentSearch)} 
                onChange={e => {
                  if (activeTab === "recurring") {
                    setBillingSearch(e.target.value);
                  } else if (activeTab === "all") {
                    setAllSearch(e.target.value);
                  } else {
                    setPaymentSearch(e.target.value);
                  }
                }} 
                className="pl-9" 
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            {/* Filtros específicos para cada tab */}
            {activeTab === "all" ? (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${expandChargesAll ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                {/* Filtros para aba Todos - iguais aos outros */}
                <div>
                  <Label className="text-sm font-medium">Status Geral</Label>
                  <Select value={billingStatusFilter} onValueChange={setBillingStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Ativo</SelectItem>
                      <SelectItem value="cancelled">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Pagamento só aparece quando expandido */}
                {expandChargesAll && (
                  <div>
                    <Label className="text-sm font-medium">Status Pagamento</Label>
                    <Button
                      variant="outline"
                      onClick={() => openStatusFilterModal('all')}
                      className="w-full justify-between text-left font-normal"
                    >
                      <span className="truncate">{getStatusDisplayText(allStatusDetailFilter, expandChargesAll, 'billing')}</span>
                      <SlidersHorizontal className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Visualização</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox 
                      id="expand-charges-all" 
                      checked={expandChargesAll}
                      onCheckedChange={setExpandChargesAll}
                    />
                    <Label htmlFor="expand-charges-all" className="text-sm">
                      Expandir cobranças
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox 
                      id="show-delivery-all" 
                      checked={showAllDelivery}
                      onCheckedChange={setShowAllDelivery}
                    />
                    <Label htmlFor="show-delivery-all" className="text-sm">
                      Mostrar pagamentos por entrega
                    </Label>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Ordenação</Label>
                  <Select value="due_date" onValueChange={() => {}}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vencimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_date">Vencimento</SelectItem>
                      <SelectItem value="default">Padrão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : activeTab === "recurring" ? (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${expandChargesOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                {/* Filtros do Escopo Aberto */}
                <div>
                  <Label className="text-sm font-medium">Status Geral</Label>
                  <Select value={billingStatusFilter} onValueChange={setBillingStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Ativo</SelectItem>
                      <SelectItem value="cancelled">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Pagamento só aparece quando expandido */}
                {expandChargesOpen && (
                  <div>
                    <Label className="text-sm font-medium">Status Pagamento</Label>
                    <Button
                      variant="outline"
                      onClick={() => openStatusFilterModal('billing')}
                      className="w-full justify-between text-left font-normal"
                    >
                      <span className="truncate">{getStatusDisplayText(billingStatusDetailFilter, expandChargesOpen, 'billing')}</span>
                      <SlidersHorizontal className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Visualização</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox 
                      id="expand-charges-open" 
                      checked={expandChargesOpen}
                      onCheckedChange={setExpandChargesOpen}
                    />
                    <Label htmlFor="expand-charges-open" className="text-sm">
                      Expandir cobranças
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox 
                      id="show-delivery-open" 
                      checked={showBillingDelivery}
                      onCheckedChange={setShowBillingDelivery}
                    />
                    <Label htmlFor="show-delivery-open" className="text-sm">
                      Mostrar pagamentos por entrega
                    </Label>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Ordenação</Label>
                  <Select value={sortByOpen} onValueChange={setSortByOpen}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Padrão</SelectItem>
                      <SelectItem value="due_date">Vencimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${expandCharges ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                {/* Filtros do Escopo Fechado */}
                <div>
                  <Label className="text-sm font-medium">Status Geral</Label>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Ativo</SelectItem>
                      <SelectItem value="cancelled">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Pagamento só aparece quando expandido */}
                {expandCharges && (
                  <div>
                    <Label className="text-sm font-medium">Status Pagamento</Label>
                    <Button
                      variant="outline"
                      onClick={() => openStatusFilterModal('payment')}
                      className="w-full justify-between text-left font-normal"
                    >
                      <span className="truncate">{getStatusDisplayText(paymentStatusDetailFilter, expandCharges, 'payment')}</span>
                      <SlidersHorizontal className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Visualização</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox 
                      id="expand-charges" 
                      checked={expandCharges}
                      onCheckedChange={setExpandCharges}
                    />
                    <Label htmlFor="expand-charges" className="text-sm">
                      Expandir cobranças
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox 
                      id="show-delivery" 
                      checked={showPaymentDelivery}
                      onCheckedChange={setShowPaymentDelivery}
                    />
                    <Label htmlFor="show-delivery" className="text-sm">
                      Mostrar pagamentos por entrega
                    </Label>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Ordenação</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Padrão</SelectItem>
                      <SelectItem value="due_date">Vencimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        <TabsContent value="all" className="border border-0 mt-4">
          <BillingTable billings={filteredAllCombinedBillings} onRefresh={handleSuccess} enableDuplicate templates={safeTemplates} />
        </TabsContent>

        <TabsContent value="recurring" className="border border-0 mt-4">
          <BillingTable billings={sortedOpenScopeBillings} onRefresh={handleSuccess} enableDuplicate templates={safeTemplates} />
        </TabsContent>

        <TabsContent value="onetime" className="border border-0 mt-4">
          <BillingTable billings={sortedClosedScopeBillings} onRefresh={handleSuccess} enableDuplicate templates={safeTemplates} />
        </TabsContent>
      </Tabs>

      <NotificationSettings open={showSettings} onClose={() => setShowSettings(false)} />
      <SimplePaymentDialog open={showSimplePaymentDialog} onClose={() => setShowSimplePaymentDialog(false)} onSuccess={handleSuccess} clients={safeClients} />
      
      {/* Modal de Filtro de Status */}
      <Dialog open={showStatusFilterModal} onOpenChange={setShowStatusFilterModal}>
        <DialogContent className="sm:max-w-md bg-[#0a0c10] border-[#1e2030] text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Filtrar por Status
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Botões de ação rápida */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => getCurrentStatusSetter()(["all"])}
                className="flex-1 bg-transparent border-[#2a2f3d] text-gray-300 hover:bg-[#2a2f3d] hover:text-white"
              >
                Selecionar Todos
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => getCurrentStatusSetter()([])}
                className="flex-1 bg-transparent border-[#2a2f3d] text-gray-300 hover:bg-[#2a2f3d] hover:text-white"
              >
                Limpar Seleção
              </Button>
            </div>
            
            {/* Lista de status com checkboxes */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {getStatusOptions(
                currentFilterType === 'billing' ? expandChargesOpen : expandCharges,
                currentFilterType
              ).map((status) => (
                <div key={status.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`modal-status-${status.value}`}
                    checked={getCurrentStatusArray().includes(status.value)}
                    onCheckedChange={() => toggleStatusInArray(getCurrentStatusArray(), status.value, getCurrentStatusSetter())}
                    className="border-[#2a2f3d] data-[state=checked]:bg-[#7c3aed] data-[state=checked]:border-[#7c3aed]"
                  />
                  <Label 
                    htmlFor={`modal-status-${status.value}`} 
                    className="text-sm font-normal cursor-pointer flex-1 text-gray-300 hover:text-white transition-colors"
                  >
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
            
            {/* Contador de selecionados */}
            <div className="text-center text-sm text-gray-400 border-t border-[#2a2f3d] pt-3">
              {getCurrentStatusArray().includes("all") 
                ? "Todos os status selecionados"
                : `${getCurrentStatusArray().length} status selecionado${getCurrentStatusArray().length !== 1 ? 's' : ''}`
              }
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowStatusFilterModal(false)}
              className="bg-transparent border-[#2a2f3d] text-gray-300 hover:bg-[#2a2f3d] hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => setShowStatusFilterModal(false)}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
            >
              Aplicar Filtros
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
