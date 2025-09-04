import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Settings, FileText, User, UserCheck } from "lucide-react";

interface NDADialogProps {
  open: boolean;
  onClose: () => void;
}

interface Client {
  id: string;
  name: string;
  email: string;
  type: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  contact_person?: string;
  company_size?: string;
  industry?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  type?: string;
  status?: string;
  payment_method?: string;
  last_invoice?: string;
  created_at?: string;
  updated_at?: string;
  cnpj?: string;
  pix?: string;
  address?: string;
  position?: string;
  phone?: string;
  preferred_template?: string;
  CPF?: string;
}

export function NDADialog({ open, onClose }: NDADialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedType, setSelectedType] = useState<'client' | 'employee'>('client');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const { toast } = useToast();

  // Load webhook URL from localStorage
  useEffect(() => {
    const savedWebhookUrl = localStorage.getItem('nda_webhook_url');
    if (savedWebhookUrl) {
      setWebhookUrl(savedWebhookUrl);
    }
  }, []);

  // Load clients and employees
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      // Load clients com todos os dados
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id, name, email, type, phone, address, city, state, 
          postal_code, country, created_at, updated_at, status,
          contact_person, company_size, industry
        `)
        .eq('status', 'active')
        .order('name');

      if (clientsError) throw clientsError;

      // Load employees com todos os dados (baseado no CSV real)
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id, name, email, type, status, payment_method, last_invoice,
          created_at, updated_at, cnpj, pix, address, position, phone,
          preferred_template, CPF
        `)
        .eq('status', 'active')
        .order('name');

      if (employeesError) throw employeesError;

      setClients(clientsData || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de clientes e funcionários.",
        variant: "destructive",
      });
    }
  };

  const saveWebhookConfig = () => {
    localStorage.setItem('nda_webhook_url', webhookUrl);
    setIsConfiguring(false);
    toast({
      title: "Configuração salva",
      description: "URL do webhook foi salva com sucesso.",
    });
  };

  const handleSendNDA = async () => {
    if (!selectedPersonId || !webhookUrl.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Selecione uma pessoa e configure o webhook.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get selected person data
      let personData;
      
      if (selectedType === 'client') {
        const client = clients.find(c => c.id === selectedPersonId);
        if (!client) throw new Error('Cliente não encontrado');
        
        personData = {
          id: client.id,
          name: client.name,
          email: client.email,
          type: 'client',
          client_type: client.type,
          phone: client.phone,
          address: client.address,
          city: client.city,
          state: client.state,
          postal_code: client.postal_code,
          country: client.country,
          contact_person: client.contact_person,
          company_size: client.company_size,
          industry: client.industry,
          created_at: client.created_at,
          updated_at: client.updated_at,
          status: client.status
        };
      } else {
        const employee = employees.find(e => e.id === selectedPersonId);
        if (!employee) throw new Error('Funcionário não encontrado');
        
        personData = {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          type: 'employee',
          position: employee.position,
          phone: employee.phone,
          employee_type: employee.type,
          payment_method: employee.payment_method,
          last_invoice: employee.last_invoice,
          cnpj: employee.cnpj,
          pix: employee.pix,
          address: employee.address,
          preferred_template: employee.preferred_template,
          CPF: employee.CPF,
          created_at: employee.created_at,
          updated_at: employee.updated_at,
          status: employee.status
        };
      }

      // Get the complete person object with ALL data
      const completePerson = selectedType === 'client' ? client : employee;
      
      // Prepare webhook payload with ALL person data
      const webhookData = {
        // Dados básicos
        action: 'send_nda',
        person_id: completePerson.id,
        person_name: completePerson.name,
        person_email: completePerson.email,
        person_type: selectedType,
        timestamp: new Date().toISOString(),
        requested_by: 'FlowCode Financial System',
        
        // ALL person data (spread all properties)
        ...completePerson
      };

      console.log('Enviando NDA via webhook:', webhookData);

      // Garantir que a URL tem protocolo
      const fullWebhookUrl = webhookUrl.startsWith('http') ? webhookUrl : `https://${webhookUrl}`;
      
      // Para localhost, usar GET direto (n8n funciona melhor com GET)
      const isDev = window.location.hostname === 'localhost';
      
      console.log('Dados enviados:', webhookData);

      try {
        // Converter dados para query parameters
        const params = new URLSearchParams(webhookData as any);
        const getUrl = `${fullWebhookUrl}?${params.toString()}`;
        
        console.log('Enviando GET para:', getUrl);
        
        // Fazer requisição GET simples (sem proxy)
        const response = await fetch(getUrl, {
          method: 'GET',
          mode: 'no-cors', // Permitir requisição cross-origin
        });

        console.log('Resposta:', {
          status: response.status,
          statusText: response.statusText,
          type: response.type
        });

        // Com no-cors, a resposta será opaque
        if (response.type === 'opaque') {
          console.log('✅ Requisição enviada com sucesso (modo no-cors)');
          // Assumir sucesso se não houve erro no fetch
        } else if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', errorText);
          throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
        } else {
          const responseData = await response.text();
          console.log('Resposta do n8n:', responseData);
        }
        
      } catch (fetchError) {
        console.error('Erro no fetch:', fetchError);
        // Mostrar mais detalhes do erro
        if (fetchError.message.includes('404')) {
          throw new Error(`Webhook não encontrado (404). Verifique se:\n1. A URL está correta\n2. O workflow n8n está ativo\n3. O webhook está configurado corretamente`);
        }
        throw fetchError;
      }

      toast({
        title: "NDA enviado",
        description: `NDA enviado com sucesso para ${personData.name}`,
      });

      // Reset form
      setSelectedPersonId('');
      setSelectedType('client');
      onClose();

    } catch (error) {
      console.error('Erro ao enviar NDA:', error);
      toast({
        title: "Erro",
        description: `Erro ao enviar NDA: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPerson = selectedType === 'client' 
    ? clients.find(c => c.id === selectedPersonId)
    : employees.find(e => e.id === selectedPersonId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enviar NDA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Webhook Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuração do Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isConfiguring ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {webhookUrl ? 'Webhook configurado' : 'Webhook não configurado'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsConfiguring(true)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {webhookUrl ? 'Alterar' : 'Configurar'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="webhook">URL do Webhook</Label>
                    <Input
                      id="webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://sua-url-webhook.com/nda"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsConfiguring(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveWebhookConfig}
                      disabled={!webhookUrl.trim()}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Person Selection */}
          <div className="space-y-4">
            <div>
              <Label>Tipo de Pessoa</Label>
              <Select
                value={selectedType}
                onValueChange={(value: 'client' | 'employee') => {
                  setSelectedType(value);
                  setSelectedPersonId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Cliente
                    </div>
                  </SelectItem>
                  <SelectItem value="employee">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Funcionário
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                {selectedType === 'client' ? 'Selecionar Cliente' : 'Selecionar Funcionário'}
              </Label>
              <Select
                value={selectedPersonId}
                onValueChange={setSelectedPersonId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Escolha um ${selectedType === 'client' ? 'cliente' : 'funcionário'}`} />
                </SelectTrigger>
                <SelectContent>
                  {(selectedType === 'client' ? clients : employees).map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      <div>
                        <div className="font-medium">{person.name}</div>
                        <div className="text-sm text-muted-foreground">{person.email}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Person Preview */}
            {selectedPerson && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {selectedType === 'client' ? <User className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      <span className="font-medium">{selectedPerson.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Email: {selectedPerson.email}</div>
                      {selectedType === 'client' && 'type' in selectedPerson && (
                        <div>Tipo: {selectedPerson.type}</div>
                      )}
                      {selectedType === 'employee' && 'position' in selectedPerson && selectedPerson.position && (
                        <div>Cargo: {selectedPerson.position}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendNDA}
              disabled={isLoading || !selectedPersonId || !webhookUrl.trim()}
              className="flex-1"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar NDA
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}