
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Inbox, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmailRecord {
  id: string;
  subject: string;
  recipient: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'failed';
  template_name?: string;
  template_type?: 'clients' | 'employees';
}

export const EmailHistorySection = () => {
  const [emailRecords, setEmailRecords] = useState<EmailRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");

  // Esta função seria implementada de verdade integrando com a tabela de histórico de emails
  // Por enquanto, usamos dados mockados
  const fetchEmailHistory = async () => {
    setIsLoading(true);
    
    try {
      // Simular a chamada ao Supabase com dados mockados
      // Na implementação real, isso seria substituído por uma chamada ao Supabase
      /*
      const { data, error } = await supabase
        .from('email_history')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEmailRecords(data || []);
      */
      
      // Dados mockados para demonstração
      setTimeout(() => {
        const mockData: EmailRecord[] = [
          {
            id: "1",
            subject: "Nota Fiscal - Março 2024",
            recipient: "joao.silva@email.com",
            created_at: "2024-03-15T14:30:00",
            status: "delivered",
            template_name: "Template NF Mensal",
            template_type: "employees"
          },
          {
            id: "2",
            subject: "Cobrança Mensal - Abril 2024",
            recipient: "empresa@dominio.com",
            created_at: "2024-04-01T09:15:00",
            status: "sent",
            template_name: "Cobrança Mensal",
            template_type: "clients"
          },
          {
            id: "3",
            subject: "Lembrete de Pagamento",
            recipient: "financeiro@cliente.com",
            created_at: "2024-04-05T16:45:00",
            status: "failed",
            template_name: "Lembrete Pagamento",
            template_type: "clients"
          }
        ];
        
        setEmailRecords(mockData);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error("Erro ao carregar histórico de emails:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de emails.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailHistory();
  }, []);

  // Filtrar e pesquisar emails
  const filteredEmails = emailRecords.filter(email => {
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.template_name && email.template_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === "all") return matchesSearch;
    if (filter === "clients") return matchesSearch && email.template_type === "clients";
    if (filter === "employees") return matchesSearch && email.template_type === "employees";
    return matchesSearch;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Histórico de Emails</CardTitle>
            <Button onClick={fetchEmailHistory} variant="outline" size="sm">
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por assunto, destinatário ou template..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="clients">Clientes</SelectItem>
                <SelectItem value="employees">Funcionários</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Carregando histórico...</p>
            </div>
          ) : filteredEmails.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Template</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>{email.subject}</TableCell>
                      <TableCell>{email.recipient}</TableCell>
                      <TableCell>{formatDate(email.created_at)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(email.status)}`}>
                          {email.status === 'delivered' ? 'Entregue' : 
                           email.status === 'sent' ? 'Enviado' : 'Falha'}
                        </span>
                      </TableCell>
                      <TableCell>{email.template_name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum email encontrado</p>
              {searchTerm || filter !== "all" ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Tente ajustar seus filtros de pesquisa
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Envie emails para vê-los aqui
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
