# 🔄 Common Development Patterns

## 📋 Table of Contents
1. [Component Patterns](#component-patterns)
2. [Data Fetching Patterns](#data-fetching-patterns)
3. [Error Handling Patterns](#error-handling-patterns)
4. [Form Management Patterns](#form-management-patterns)
5. [Modal & Dialog Patterns](#modal--dialog-patterns)
6. [Search & Filter Patterns](#search--filter-patterns)
7. [Status Management Patterns](#status-management-patterns)

## 🧩 Component Patterns

### 1. **Feature Component Structure**

Every major feature follows this structure:

```
feature/
├── FeatureMain.tsx          ← Main container component
├── FeatureTable.tsx         ← Data display component
├── FeatureRow.tsx           ← Individual row logic
├── FeatureDialog.tsx        ← Modal/dialog components
├── NewFeatureForm.tsx       ← Creation forms
└── types.ts                 ← Feature-specific types
```

**Example Implementation**:

```typescript
// PaymentTable.tsx - Main table component
export const PaymentTable = ({ 
  payments, 
  onRefresh, 
  templates 
}: PaymentTableProps) => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleOpenDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {/* Table headers */}
        </TableHeader>
        <TableBody>
          {payments.map(payment => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              onOpenDetails={handleOpenDetails}
              onRefresh={onRefresh}
            />
          ))}
        </TableBody>
      </Table>

      {selectedPayment && (
        <PaymentDetailsDialog
          payment={selectedPayment}
          open={showDetails}
          onClose={() => setShowDetails(false)}
          onUpdate={onRefresh}
          templates={templates}
        />
      )}
    </div>
  );
};
```

### 2. **Custom Hook Pattern**

Each domain has a specialized hook for data management:

```typescript
// useFeatureData.ts - Data management hook
export const usePaymentData = () => {
  // 1. Fetch raw data
  const { data: rawPayments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients(name, responsible_name),
          recurring_billing(description)
        `)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // 2. Transform data for UI
  const payments = useMemo(() => {
    if (!rawPayments) return [];
    
    return rawPayments.map(payment => ({
      ...payment,
      formattedAmount: formatCurrency(payment.amount),
      formattedDueDate: format(parseISO(payment.due_date), 'dd/MM/yyyy'),
      clientName: payment.clients?.name || 'Cliente não encontrado'
    }));
  }, [rawPayments]);

  // 3. Provide actions
  const refreshPayments = useCallback(() => {
    queryClient.invalidateQueries(['payments']);
  }, []);

  return {
    payments,
    isLoading,
    refreshPayments
  };
};
```

### 3. **Error Boundary Pattern**

Wrap components with error boundaries for graceful failures:

```typescript
// ErrorBoundary.tsx
class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Feature error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-md">
          <h3 className="text-red-800">Algo deu errado</h3>
          <p className="text-red-600">
            Ocorreu um erro ao carregar esta seção. Tente recarregar a página.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🔄 Data Fetching Patterns

### 1. **Query with Transformation**

```typescript
const useTransformedData = () => {
  return useQuery({
    queryKey: ['data-key'],
    queryFn: async () => {
      // Fetch raw data
      const { data, error } = await supabase
        .from('table')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    select: (data) => {
      // Transform data for UI
      return data.map(item => ({
        ...item,
        displayName: formatName(item.name),
        status: getStatusInfo(item.status)
      }));
    },
  });
};
```

### 2. **Optimistic Updates**

```typescript
const useOptimisticUpdate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateItem,
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['items']);
      
      // Snapshot previous value
      const previousItems = queryClient.getQueryData(['items']);
      
      // Optimistically update
      queryClient.setQueryData(['items'], (old: Item[]) =>
        old.map(item => 
          item.id === newItem.id ? { ...item, ...newItem } : item
        )
      );
      
      return { previousItems };
    },
    onError: (err, newItem, context) => {
      // Rollback on error
      queryClient.setQueryData(['items'], context?.previousItems);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['items']);
    },
  });
};
```

### 3. **Parallel Data Fetching**

```typescript
const useParallelData = () => {
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });
  
  const paymentsQuery = useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
  });
  
  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });
  
  return {
    clients: clientsQuery.data ?? [],
    payments: paymentsQuery.data ?? [],
    templates: templatesQuery.data ?? [],
    isLoading: clientsQuery.isLoading || paymentsQuery.isLoading || templatesQuery.isLoading,
    error: clientsQuery.error || paymentsQuery.error || templatesQuery.error
  };
};
```

## ❌ Error Handling Patterns

### 1. **Service Layer Error Handling**

```typescript
// services/paymentService.ts
export class PaymentServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PaymentServiceError';
  }
}

export const paymentService = {
  async updatePayment(id: string, data: PaymentData): Promise<Payment> {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new PaymentServiceError(
          'Falha ao atualizar pagamento',
          'UPDATE_FAILED',
          error
        );
      }

      return payment;
    } catch (error) {
      if (error instanceof PaymentServiceError) {
        throw error;
      }
      
      throw new PaymentServiceError(
        'Erro inesperado ao atualizar pagamento',
        'UNEXPECTED_ERROR',
        error
      );
    }
  }
};
```

### 2. **Component Error Handling**

```typescript
const PaymentComponent = () => {
  const { toast } = useToast();
  
  const handlePaymentUpdate = async (paymentData: PaymentData) => {
    try {
      await paymentService.updatePayment(paymentId, paymentData);
      
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso."
      });
    } catch (error) {
      console.error('Payment update error:', error);
      
      if (error instanceof PaymentServiceError) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro inesperado",
          description: "Algo deu errado. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Component JSX...
};
```

## 📝 Form Management Patterns

### 1. **React Hook Form with Zod Validation**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const paymentSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  payment_method: z.enum(['pix', 'boleto', 'credit_card']),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const PaymentForm = ({ onSubmit, initialData }: PaymentFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: initialData
  });

  const onSubmitForm = async (data: PaymentFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handling
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            {...register('description')}
            error={errors.description?.message}
          />
        </div>
        
        <div>
          <Label htmlFor="amount">Valor</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
          />
        </div>
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};
```

## 🪟 Modal & Dialog Patterns

### 1. **Controlled Dialog Pattern**

```typescript
// Parent component
const ParentComponent = () => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  
  const handleOpenDialog = (item: Item) => {
    setSelectedItem(item);
    setShowDialog(true);
  };
  
  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedItem(null);
  };
  
  return (
    <>
      {/* Trigger */}
      <Button onClick={() => handleOpenDialog(item)}>
        Edit Item
      </Button>
      
      {/* Dialog */}
      {selectedItem && (
        <ItemDialog
          item={selectedItem}
          open={showDialog}
          onClose={handleCloseDialog}
          onUpdate={handleRefresh}
        />
      )}
    </>
  );
};

// Dialog component
const ItemDialog = ({ item, open, onClose, onUpdate }: ItemDialogProps) => {
  const handleSave = async (data: ItemData) => {
    try {
      await updateItem(item.id, data);
      toast({ title: "Item atualizado com sucesso" });
      onUpdate(); // Refresh parent data
      onClose();  // Close dialog
    } catch (error) {
      // Error handling
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Item</DialogTitle>
        </DialogHeader>
        
        <ItemForm
          initialData={item}
          onSubmit={handleSave}
        />
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

## 🔍 Search & Filter Patterns

### 1. **Multi-Tab Search Pattern**

```typescript
const MultiTabComponent = () => {
  // Separate search states for each tab
  const [activeTab, setActiveTab] = useState('all');
  const [allTabSearch, setAllTabSearch] = useState('');
  const [tab1Search, setTab1Search] = useState('');
  const [tab2Search, setTab2Search] = useState('');
  
  // Dynamic input handling
  const getCurrentSearch = () => {
    switch (activeTab) {
      case 'all': return allTabSearch;
      case 'tab1': return tab1Search;
      case 'tab2': return tab2Search;
      default: return '';
    }
  };
  
  const setCurrentSearch = (value: string) => {
    switch (activeTab) {
      case 'all': setAllTabSearch(value); break;
      case 'tab1': setTab1Search(value); break;
      case 'tab2': setTab2Search(value); break;
    }
  };
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Buscar..."
          value={getCurrentSearch()}
          onChange={(e) => setCurrentSearch(e.target.value)}
        />
      </div>
      
      <TabsList>
        <TabsTrigger value="all">Todos</TabsTrigger>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      
      <TabsContent value="all">
        <FilteredData data={data} search={allTabSearch} />
      </TabsContent>
      {/* Other tabs */}
    </Tabs>
  );
};
```

### 2. **Advanced Filter Pattern**

```typescript
const useAdvancedFilter = (data: Item[]) => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: { start: '', end: '' },
    categories: [] as string[]
  });
  
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const itemDate = new Date(item.date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (itemDate < startDate || itemDate > endDate) {
          return false;
        }
      }
      
      // Category filter
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(item.category)) {
          return false;
        }
      }
      
      return true;
    });
  }, [data, filters]);
  
  return {
    filteredData,
    filters,
    setFilters,
    updateFilter: (key: keyof typeof filters, value: any) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };
};
```

## 🎯 Status Management Patterns

### 1. **Status Enum Pattern**

```typescript
// types/status.ts
export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid', 
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  PARTIALLY_PAID: 'partially_paid'
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PaymentStatusConfig = {
  [PaymentStatus.PENDING]: {
    label: 'Pendente',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-800',
    canEdit: true,
    canDelete: true
  },
  [PaymentStatus.PAID]: {
    label: 'Pago',
    color: 'bg-green-500', 
    textColor: 'text-green-800',
    canEdit: false,
    canDelete: false
  },
  // ... other statuses
} as const;
```

### 2. **Status Component Pattern**

```typescript
interface StatusBadgeProps {
  status: PaymentStatusType;
  variant?: 'default' | 'outline';
}

export const StatusBadge = ({ status, variant = 'default' }: StatusBadgeProps) => {
  const config = PaymentStatusConfig[status];
  
  return (
    <Badge 
      variant={variant}
      className={`${config.color} text-white`}
    >
      {config.label}
    </Badge>
  );
};

// Usage
<StatusBadge status={payment.status} />
```

### 3. **Status Transition Pattern**

```typescript
const useStatusTransition = (currentStatus: PaymentStatusType) => {
  const getAvailableTransitions = useCallback(() => {
    switch (currentStatus) {
      case PaymentStatus.PENDING:
        return [PaymentStatus.PAID, PaymentStatus.CANCELLED];
      case PaymentStatus.PAID:
        return []; // No transitions from paid
      case PaymentStatus.OVERDUE:
        return [PaymentStatus.PAID, PaymentStatus.CANCELLED];
      default:
        return [];
    }
  }, [currentStatus]);
  
  const canTransitionTo = useCallback((targetStatus: PaymentStatusType) => {
    return getAvailableTransitions().includes(targetStatus);
  }, [getAvailableTransitions]);
  
  return {
    availableTransitions: getAvailableTransitions(),
    canTransitionTo
  };
};
```

These patterns provide a solid foundation for consistent development across the FlowCode Financial application. They promote code reuse, maintainability, and a better developer experience.