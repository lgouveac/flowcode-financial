import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ExternalLink, Copy, Calendar, User, DollarSign, FileText, MapPin, Clock, Signature, Eye, Pencil } from "lucide-react";
import { Contract } from "@/types/contract";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { useContracts } from "@/hooks/useContracts";
import { EditContractDialog } from "./EditContractDialog";

interface ContractDetailsDialogProps {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "suspended":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case "active":
      return "Ativo";
    case "completed":
      return "Concluído/Assinado";
    case "cancelled":
      return "Cancelado";
    case "suspended":
      return "Suspenso";
    default:
      return "Indefinido";
  }
};

export function ContractDetailsDialog({ contract, open, onClose }: ContractDetailsDialogProps) {
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();
  const { contracts } = useContracts();

  // Buscar o contrato atualizado da lista para garantir que está sincronizado
  const currentContract = contracts.find(c => c.id === contract?.id) || contract;

  if (!currentContract) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            Detalhes do Contrato #{currentContract.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Informações Gerais */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Informações Gerais</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                    className="text-amber-600 hover:bg-amber-50"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  {(currentContract.contract_type === 'open_scope' || currentContract.contract_type === 'closed_scope') && currentContract.contract_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/contract-visual/${currentContract.contract_id}`, '_blank')}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Contrato Visual
                    </Button>
                  )}
                  <Badge className={getStatusColor(currentContract.status)}>
                    {getStatusLabel(currentContract.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Cliente
                  </Label>
                  <p className="text-lg font-medium">{currentContract.clients?.name || "Não vinculado"}</p>
                  {currentContract.clients?.email && (
                    <p className="text-sm text-muted-foreground">{currentContract.clients.email}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Escopo</Label>
                  <p className="text-lg line-clamp-2 leading-6 max-h-12 overflow-hidden">{currentContract.scope || "-"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo de Contrato</Label>
                  <p className="text-lg capitalize">
                    {currentContract.contract_type === 'open_scope' ? 'Escopo Aberto' : 
                     currentContract.contract_type === 'closed_scope' ? 'Escopo Fechado' : 
                     currentContract.contract_type || "-"}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo de Contratante</Label>
                  <p className="text-lg capitalize">
                    {currentContract.contractor_type === 'individual' ? 'Pessoa Física' : 
                     currentContract.contractor_type === 'legal_entity' ? 'Pessoa Jurídica' : 
                     currentContract.contractor_type || "-"}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Valor Total
                  </Label>
                  <p className="text-lg font-medium">{currentContract.total_value ? formatCurrency(currentContract.total_value) : "-"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Parcelas</Label>
                  <p className="text-lg">
                    {currentContract.installment_value_text 
                      ? currentContract.installment_value_text 
                      : currentContract.installment_value 
                        ? `${currentContract.installments || 1}x de ${formatCurrency(currentContract.installment_value)}`
                        : `${currentContract.installments || 1}x parcelas`
                    }
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Período
                  </Label>
                  <p className="text-lg">
                    {currentContract.start_date ? formatDate(new Date(currentContract.start_date), "dd/MM/yyyy") : "-"}
                  </p>
                  {currentContract.end_date && (
                    <p className="text-sm text-muted-foreground">
                      até {formatDate(new Date(currentContract.end_date), "dd/MM/yyyy")}
                    </p>
                  )}
                </div>
                
                {currentContract.Horas && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Horas
                    </Label>
                    <p className="text-lg">{currentContract.Horas}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview do Contrato */}
          {currentContract.link_contrato && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Preview do Contrato</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(currentContract.link_contrato!, "Link do contrato")}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(currentContract.link_contrato, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewExpanded(!previewExpanded)}
                    >
                      {previewExpanded ? 'Recolher' : 'Expandir'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg overflow-hidden transition-all duration-300" 
                  style={{ height: previewExpanded ? '800px' : '400px' }}
                >
                  <iframe
                    src={currentContract.link_contrato}
                    className="w-full h-full"
                    title="Preview do Contrato"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações de Assinatura */}
          {(currentContract.data_de_assinatura || currentContract.data_assinatura_flowcode) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Signature className="h-5 w-5" />
                  Dados de Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Assinatura do Cliente */}
                  {currentContract.data_de_assinatura && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-blue-700 border-b border-blue-200 pb-2">
                        Assinatura do Cliente
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Data de Assinatura</Label>
                          <p className="text-lg">
                            {formatDateTime(currentContract.data_de_assinatura)}
                          </p>
                        </div>

                        {currentContract.ip && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              IP do Cliente
                            </Label>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-mono">{currentContract.ip}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(currentContract.ip!, "IP do cliente")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assinatura da FlowCode */}
                  {(currentContract.data_assinatura_flowcode || currentContract.assinante_flowcode || currentContract.ip_flowcode) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-purple-700 border-b border-purple-200 pb-2">
                        Assinatura FlowCode
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentContract.data_assinatura_flowcode && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Data de Assinatura FlowCode</Label>
                            <p className="text-lg">
                              {formatDateTime(currentContract.data_assinatura_flowcode)}
                            </p>
                          </div>
                        )}

                        {currentContract.assinante_flowcode && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Assinante FlowCode
                            </Label>
                            <p className="text-lg">{currentContract.assinante_flowcode}</p>
                          </div>
                        )}

                        {currentContract.ip_flowcode && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              IP FlowCode
                            </Label>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-mono">{currentContract.ip_flowcode}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(currentContract.ip_flowcode!, "IP da FlowCode")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Técnicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
                  <p className="text-lg">{formatDateTime(currentContract.created_at)}</p>
                </div>
                
                {currentContract.updated_at && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Última Atualização</Label>
                    <p className="text-lg">{formatDateTime(currentContract.updated_at)}</p>
                  </div>
                )}
                
                {currentContract.ip && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">IP de Criação</Label>
                    <p className="text-lg font-mono">{currentContract.ip}</p>
                  </div>
                )}
                
                {currentContract.contract_id && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ID do Contrato</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 overflow-x-auto">
                        <p className="text-lg font-mono whitespace-nowrap">{currentContract.contract_id}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(currentContract.contract_id!, "ID do contrato")}
                        className="flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {currentContract.obs && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="max-h-32 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{currentContract.obs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>

    {currentContract && (
      <EditContractDialog
        contract={currentContract}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    )}
    </>
  );
}