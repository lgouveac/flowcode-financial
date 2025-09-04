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
import { Loader2 } from "lucide-react";

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
  start_date: string;
  end_date?: string;
  status: string;
  link_contrato?: string;
}

export default function ContractSigning() {
  const { contractId } = useParams<{ contractId: string }>();
  console.log('ContractSigning component loaded with contractId:', contractId);
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
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

    console.log('Fetching contract with ID:', contractId);

    try {
      const { data, error } = await supabase
        .from('Contratos')
        .select(`
          *,
          clients!Contratos_client_id_fkey (
            name,
            email
          )
        `)
        .eq('id', parseInt(contractId))
        .single();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
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

    // Validar assinatura
    let signatureData = '';
    if (signatureType === 'text') {
      if (!textSignature.trim()) {
        toast({
          title: "Erro",
          description: "Por favor, digite seu nome completo.",
          variant: "destructive",
        });
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
        return;
      }

      signatureData = canvas.toDataURL();
    }

    setSigning(true);

    try {
      // Capturar IP do cliente
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();

      // Atualizar contrato como assinado
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
      setContract({ ...contract, status: 'completed' });

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
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando contrato...</span>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Contrato não encontrado</h2>
            <p className="text-muted-foreground">
              O contrato solicitado não existe ou não está disponível.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Assinatura de Contrato</h1>
          <p className="text-muted-foreground">
            Revise as informações e assine o contrato abaixo
          </p>
        </div>

        {/* Preview do Contrato */}
        {contract.link_contrato ? (
          <Card>
            <CardHeader>
              <CardTitle>Visualizar Contrato</CardTitle>
              <p className="text-sm text-muted-foreground">
                Revise o contrato antes de assinar
              </p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
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
                >
                  Abrir em Nova Aba
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Contrato em Preparação</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className="mb-4 text-amber-600">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Documento sendo preparado</h3>
              <p className="text-muted-foreground mb-4">
                O contrato está sendo gerado e estará disponível para visualização em breve.
              </p>
              <p className="text-sm text-muted-foreground">
                Você pode prosseguir com a assinatura baseado nas informações abaixo.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Informações do Contrato */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Detalhes do Contrato</CardTitle>
              <Badge 
                className={
                  contract.status === 'completed' 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
                }
              >
                {contract.status === 'completed' ? 'Assinado' : 'Aguardando Assinatura'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                <p className="text-lg font-medium">{contract.clients?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Escopo</Label>
                <p className="text-lg">{contract.scope}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Valor Total</Label>
                <p className="text-lg font-medium">{formatCurrency(contract.total_value)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Parcelas</Label>
                <p className="text-lg">
                  {contract.installment_value_text 
                    ? contract.installment_value_text 
                    : contract.installment_value 
                      ? `${contract.installments}x de ${formatCurrency(contract.installment_value)}`
                      : `${contract.installments}x parcelas`
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Data de Início</Label>
                <p className="text-lg">{formatDate(new Date(contract.start_date), "dd/MM/yyyy")}</p>
              </div>
              {contract.end_date && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data de Término</Label>
                  <p className="text-lg">{formatDate(new Date(contract.end_date), "dd/MM/yyyy")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assinatura */}
        {contract.status !== 'completed' && (
          <Card>
            <CardHeader>
              <CardTitle>Assinatura Digital</CardTitle>
              <p className="text-sm text-muted-foreground">
                Escolha como deseja assinar o contrato
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipo de Assinatura */}
              <div className="flex space-x-4">
                <Button
                  variant={signatureType === 'text' ? 'default' : 'outline'}
                  onClick={() => setSignatureType('text')}
                >
                  Assinar com Texto
                </Button>
                <Button
                  variant={signatureType === 'draw' ? 'default' : 'outline'}
                  onClick={() => setSignatureType('draw')}
                >
                  Desenhar Assinatura
                </Button>
              </div>

              {/* Campo de Assinatura */}
              {signatureType === 'text' ? (
                <div>
                  <Label htmlFor="signature">Nome Completo</Label>
                  <Input
                    id="signature"
                    value={textSignature}
                    onChange={(e) => setTextSignature(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="mt-1"
                  />
                </div>
              ) : (
                <div>
                  <Label>Desenhe sua Assinatura</Label>
                  <div className="border rounded-lg p-4 bg-white">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={200}
                      className="border rounded cursor-crosshair w-full"
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
                      className="mt-2"
                    >
                      Limpar Assinatura
                    </Button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={signing}
                className="w-full"
                size="lg"
              >
                {signing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assinando Contrato...
                  </>
                ) : (
                  'Assinar Contrato'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {contract.status === 'completed' && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="mb-4 text-green-600">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">Contrato Assinado!</h3>
              <p className="text-muted-foreground">
                O contrato foi assinado com sucesso e está sendo processado.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}