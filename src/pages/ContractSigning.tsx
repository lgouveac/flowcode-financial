import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Loader2, FileText } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

interface Contract {
  id: number;
  clients?: {
    name: string;
    email?: string;
  };
  scope: string;
  total_value: number;
  installments: number;
  installment_value: number;
  installment_value_text?: string;
  start_date: string;
  end_date?: string;
  status: string;
  link_contrato?: string;
  obs?: string;
  // Campos de assinatura cliente
  data_de_assinatura?: string;
  ip?: string;
  // Campos de assinatura FlowCode
  data_assinatura_flowcode?: string;
  ip_flowcode?: string;
  assinante_flowcode?: string;
}

export default function ContractSigning() {
  const { contractId } = useParams<{ contractId: string }>();
  const { user } = useAuth(); // Verificar se usuário está logado
  console.log('ContractSigning component loaded with contractId:', contractId);
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para assinatura do cliente
  const [signing, setSigning] = useState(false);
  const [signatureType, setSignatureType] = useState<'text' | 'draw'>('text');
  const [textSignature, setTextSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    if (!contractId) {
      console.log('No contractId provided');
      return;
    }

    console.log('Fetching contract with contract_id:', contractId);

    try {
      // Buscar contrato apenas pelo contract_id
      const { data, error } = await supabase
        .from('Contratos')
        .select(`
          *,
          clients!Contratos_client_id_fkey (
            name,
            email
          )
        `)
        .eq('contract_id', contractId)
        .single();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      if (!data) {
        console.log('No contract found with contract_id:', contractId);
        console.log('This might mean:');
        console.log('1. Contract_id does not exist in database');  
        console.log('2. Contract exists but contract_id field is empty');
        console.log('3. URL parameter is incorrect');
        return;
      }
      
      console.log('Contract loaded successfully:', data);
      setContract(data);
    } catch (error) {
      console.error('Error fetching contract - full error:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      
      toast({
        title: "Erro",
        description: `Não foi possível carregar o contrato. ${error?.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };


  const handleSubmit = async () => {
    if (!contract) return;

    setSigning(true);

    // Se o contrato já está assinado, apenas chamar o webhook
    if (contract.status === 'completed') {
      try {
        // Buscar webhook dinâmico de assinatura
        const webhookUrl = localStorage.getItem('prestacao_servico_assinatura_webhook');
        
        console.log('🔍 URL do webhook de assinatura (localStorage):', webhookUrl);
        
        if (webhookUrl) {
          const webhookParams = new URLSearchParams();
          webhookParams.append('action', 'sign_contract');
          webhookParams.append('timestamp', new Date().toISOString());
          webhookParams.append('contract_id', contract.id.toString());
          webhookParams.append('contract_status', 'completed');
          webhookParams.append('client_name', contract.clients?.name || '');
          webhookParams.append('contract_scope', contract.scope || '');
          webhookParams.append('total_value', contract.total_value?.toString() || '');
          
          const finalWebhookUrl = `${webhookUrl}?${webhookParams}`;
          console.log('🎯 URL FINAL DO WEBHOOK:', finalWebhookUrl);

          const webhookResponse = await fetch(finalWebhookUrl, {
            method: 'GET',
            mode: 'no-cors',
          });
          console.log('✅ Webhook chamado com sucesso');

          toast({
            title: "Webhook chamado!",
            description: "Webhook de assinatura foi executado com sucesso.",
          });
        } else {
          toast({
            title: "Webhook não configurado",
            description: "Configure o webhook de assinatura nas configurações.",
            variant: "destructive",
          });
        }
      } catch (webhookError) {
        console.error('Erro ao chamar webhook:', webhookError);
        toast({
          title: "Erro no webhook",
          description: "Houve problema ao chamar o webhook, mas o contrato está assinado.",
          variant: "destructive",
        });
      } finally {
        setSigning(false);
      }
      return;
    }

    // Validar assinatura apenas se não estiver assinado
    let signatureData = '';
    if (signatureType === 'text') {
      if (!textSignature.trim()) {
        toast({
          title: "Erro",
          description: "Por favor, digite seu nome completo.",
          variant: "destructive",
        });
        setSigning(false);
        return;
      }
      signatureData = textSignature.trim();
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Verificar se há algo desenhado
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasDrawing = imageData.data.some((channel, index) => 
        index % 4 === 3 && channel !== 0 // Verificar canal alpha
      );

      if (!hasDrawing) {
        toast({
          title: "Erro",
          description: "Por favor, desenhe sua assinatura.",
          variant: "destructive",
        });
        setSigning(false);
        return;
      }

      signatureData = canvas.toDataURL();
    }

    try {
      // Capturar IP do cliente
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();

      // Atualizar contrato como assinado pelo cliente
      const { error } = await supabase
        .from('Contratos')
        .update({
          status: 'completed',
          data_de_assinatura: new Date().toISOString(),
          ip: ipData.ip,
        })
        .eq('id', contract.id);

      if (error) throw error;

      toast({
        title: "Contrato Assinado",
        description: "O contrato foi assinado com sucesso!",
      });

      // Atualizar estado local
      setContract({ 
        ...contract, 
        status: 'completed',
        data_de_assinatura: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error signing contract:', error);
      toast({
        title: "Erro",
        description: "Não foi possível assinar o contrato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando contrato...</span>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Contrato não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O contrato solicitado não existe ou não está disponível.
            </p>
            <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
              <p><strong>Contract ID buscado:</strong> {contractId}</p>
              <p><strong>Loading state:</strong> {loading ? 'true' : 'false'}</p>
              <p>Verifique se o contract_id está correto na URL</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="w-full max-w-4xl mx-auto space-y-8">

        {/* Preview do Contrato */}
        {contract.link_contrato ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Visualizar Contrato</h2>
            <div className="rounded-lg overflow-hidden border border-white/20" style={{ height: '600px' }}>
              <iframe
                src={contract.link_contrato}
                className="w-full h-full"
                title="Preview do Contrato"
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => window.open(contract.link_contrato, '_blank')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Abrir em Nova Aba
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
            <div className="mb-4 text-amber-400">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Documento sendo preparado</h3>
            <p className="text-slate-300 mb-4">
              O contrato está sendo gerado e estará disponível para visualização em breve.
            </p>
            <p className="text-sm text-slate-400">
              Você pode prosseguir com a assinatura baseado nas informações abaixo.
            </p>
          </div>
        )}

        {/* Informações do Contrato */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-white">Detalhes do Contrato</h2>
            <Badge
              className={
                contract.status === 'completed'
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }
            >
              {contract.status === 'completed' ? 'Assinado' : 'Aguardando Assinatura'}
            </Badge>
          </div>

          <div className="space-y-8">
            <div>
              <label className="text-sm font-medium text-slate-400 uppercase tracking-wide">Cliente</label>
              <p className="text-xl font-medium text-white mt-2">{contract.clients?.name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400 uppercase tracking-wide">Escopo</label>
              <div className="text-lg text-slate-200 whitespace-pre-wrap leading-relaxed mt-2">{contract.scope}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wide">Valor Total</label>
                <p className="text-xl font-medium text-white mt-2">{formatCurrency(contract.total_value)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wide">Parcelas</label>
                <p className="text-lg text-slate-200 mt-2">
                  {contract.installment_value_text
                    ? contract.installment_value_text
                    : contract.installment_value
                      ? `${contract.installments}x de ${formatCurrency(contract.installment_value)}`
                      : `${contract.installments}x parcelas`
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wide">Data de Início</label>
                <p className="text-lg text-slate-200 mt-2">{formatDate(new Date(contract.start_date), "dd/MM/yyyy")}</p>
              </div>
              {contract.end_date && (
                <div>
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-wide">Data de Término</label>
                  <p className="text-lg text-slate-200 mt-2">{formatDate(new Date(contract.end_date), "dd/MM/yyyy")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assinatura do Cliente */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
            <h2 className="text-2xl font-semibold text-white mb-2">Assinatura Digital</h2>
            <p className="text-slate-300 mb-8">
              {contract.status === 'completed' 
                ? 'Contrato já assinado. Use o botão abaixo para chamar webhook ou re-assinar.'
                : 'Escolha como deseja assinar o contrato'
              }
            </p>

            <div className="space-y-8">
              {/* Tipo de Assinatura */}
              <div className="flex space-x-4">
                <Button
                  variant={signatureType === 'text' ? 'default' : 'outline'}
                  onClick={() => setSignatureType('text')}
                  className={signatureType === 'text'
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }
                >
                  Assinar com Texto
                </Button>
                <Button
                  variant={signatureType === 'draw' ? 'default' : 'outline'}
                  onClick={() => setSignatureType('draw')}
                  className={signatureType === 'draw'
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }
                >
                  Desenhar Assinatura
                </Button>
              </div>

              {/* Campo de Assinatura */}
              {signatureType === 'text' ? (
                <div>
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-wide">Nome Completo</label>
                  <Input
                    id="signature"
                    value={textSignature}
                    onChange={(e) => setTextSignature(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="mt-2 bg-white/10 border-white/20 text-white placeholder-slate-400 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-wide">Desenhe sua Assinatura</label>
                  <div className="border border-white/20 rounded-lg p-4 bg-white/5 mt-2">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={200}
                      className="border border-white/10 rounded cursor-crosshair w-full bg-white"
                      style={{ maxWidth: '100%' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCanvas}
                      className="mt-3 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Limpar Assinatura
                    </Button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={signing}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-medium"
                size="lg"
              >
                {signing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {contract.status === 'completed' ? 'Enviando...' : 'Assinando Contrato...'}
                  </>
                ) : (
                  contract.status === 'completed' ? 'Enviar Contrato Assinado' : 'Assinar Contrato'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Sucesso - Fora da estrutura principal */}
      {contract.status === 'completed' && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 h-[100vh] w-[100vw] bg-background z-50 flex flex-col text-foreground" 
          style={{ 
            margin: 0, 
            padding: 0, 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 50,
            overflow: 'hidden',
            boxSizing: 'border-box',
            border: 'none',
            outline: 'none'
          }}
        >
          {/* Header */}
          <div className="p-6 text-center">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto bg-green-500 rounded-full p-2" fill="white" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Contrato Assinado com Sucesso!</h1>
            <p className="text-muted-foreground">
              Obrigado por assinar o contrato. Abaixo estão as informações importantes:
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {contract.obs && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <FileText className="h-5 w-5" />
                      Observações e Instruções Importantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-lg max-w-none text-muted-foreground whitespace-pre-wrap [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ol]:text-muted-foreground [&_li]:text-muted-foreground [&_strong]:text-foreground [&_b]:text-foreground"
                      dangerouslySetInnerHTML={{ __html: contract.obs }}
                    />
                  </CardContent>
                </Card>
              )}
              
              {!contract.obs && (
                <Card className="bg-card border-border">
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      Não há observações adicionais para este contrato.
                    </p>
                    <p className="text-muted-foreground/80 mt-2">
                      O contrato foi processado com sucesso.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Em caso de dúvidas, entre em contato conosco através dos canais oficiais.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              FlowCode Financial • Contrato assinado em {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}