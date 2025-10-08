import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Clock,
  BarChart3,
  Calendar,
  Info,
  User
} from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { formatCurrency } from "@/components/payments/utils/formatUtils";
import { Lead } from "@/types/lead";
import { getLeadMetrics } from "@/utils/leadUtils";

export function LeadsDashboard() {
  const { leads, isLoading } = useLeads();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'pipeline' | 'potential'>('pipeline');

  const metrics = useMemo(() => {
    if (!leads.length) {
      return {
        totalLeads: 0,
        wonLeads: 0,
        conversionRate: 0,
        averageValue: 0,
        activePipelineValue: 0,
        wonLeadsValue: 0,
        lostLeadsValue: 0,
        potentialValue: 0,
        statusBreakdown: {},
        avgClosingTime: 0,
        averageClosingTimeFormatted: "N/A",
        activePipelineLeads: [],
        leadsWithValue: []
      };
    }

    const leadMetrics = getLeadMetrics(leads);

    // Calcular valores financeiros
    const leadsWithValue = leads.filter(lead => lead.Valor && lead.Valor > 0);

    const activePipelineLeads = leadsWithValue.filter(lead =>
      lead.Status !== "Won" && lead.Status !== "Lost"
    );
    const activePipelineValue = activePipelineLeads.reduce((sum, lead) => sum + (lead.Valor || 0), 0);

    const wonLeadsValue = leadsWithValue
      .filter(lead => lead.Status === "Won")
      .reduce((sum, lead) => sum + (lead.Valor || 0), 0);

    const lostLeadsValue = leadsWithValue
      .filter(lead => lead.Status === "Lost")
      .reduce((sum, lead) => sum + (lead.Valor || 0), 0);

    const averageValue = leadsWithValue.length > 0 ?
      leadsWithValue.reduce((sum, lead) => sum + (lead.Valor || 0), 0) / leadsWithValue.length : 0;

    const potentialValue = leadMetrics.conversionRate > 0 ? activePipelineValue * (leadMetrics.conversionRate / 100) : 0;

    const statusBreakdown = leads.reduce((acc, lead) => {
      acc[lead.Status] = (acc[lead.Status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...leadMetrics,
      averageValue,
      activePipelineValue,
      wonLeadsValue,
      lostLeadsValue,
      potentialValue,
      statusBreakdown,
      avgClosingTime: leadMetrics.averageClosingTime,
      activePipelineLeads,
      leadsWithValue
    };
  }, [leads]);

  const openPipelineModal = () => {
    setModalType('pipeline');
    setModalOpen(true);
  };

  const openPotentialModal = () => {
    setModalType('potential');
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">Carregando dados do dashboard...</p>
      </div>
    );
  }

  const statusLabels = {
    "Income": "Novos Leads",
    "Contact Made": "Contato Feito",
    "Proposal Sent": "Proposta Enviada",
    "Won": "Ganhos",
    "Lost": "Perdidos"
  };

  const statusColors = {
    "Income": "bg-blue-500",
    "Contact Made": "bg-yellow-500",
    "Proposal Sent": "bg-purple-500",
    "Won": "bg-green-500",
    "Lost": "bg-red-500"
  };

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              leads no pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.wonLeads} de {metrics.totalLeads} leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageValue)}</div>
            <p className="text-xs text-muted-foreground">
              por lead fechado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Fechamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageClosingTimeFormatted}
            </div>
            <p className="text-xs text-muted-foreground">
              tempo médio para fechar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Pipeline por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${statusColors[status] || 'bg-gray-500'}`}></div>
                  <span className="text-sm font-medium">
                    {statusLabels[status] || status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {count}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({((count / metrics.totalLeads) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pipeline Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-3xl font-bold text-blue-600 mb-4 cursor-pointer hover:text-blue-700 transition-colors flex items-center gap-2"
              onClick={openPipelineModal}
              title="Clique para ver detalhes"
            >
              {formatCurrency(metrics.activePipelineValue)}
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor ganho:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(metrics.wonLeadsValue)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor perdido:</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(metrics.lostLeadsValue)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor médio:</span>
                <span className="font-medium">{formatCurrency(metrics.averageValue)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Potencial de fechamento:</span>
                <span
                  className="font-medium text-green-600 cursor-pointer hover:text-green-700 transition-colors flex items-center gap-1"
                  onClick={openPotentialModal}
                  title="Clique para ver como foi calculado"
                >
                  {formatCurrency(metrics.potentialValue)}
                  <Info className="h-3 w-3" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Modal de Detalhamento */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalType === 'pipeline' ? (
                <>
                  <Target className="h-5 w-5" />
                  Detalhamento do Pipeline Ativo
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5" />
                  Como foi calculado o Potencial de Fechamento
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {modalType === 'pipeline' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Pipeline Ativo</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Valor total dos leads que ainda estão em processo (excluindo "Ganhos" e "Perdidos"):
                </p>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(metrics.activePipelineValue)}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Leads no Pipeline ({metrics.activePipelineLeads.length}):</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {metrics.activePipelineLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{lead.Nome}</div>
                          <div className="text-sm text-muted-foreground">{lead.Email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(lead.Valor || 0)}</div>
                        <Badge className={`text-xs ${statusColors[lead.Status]}`}>
                          {statusLabels[lead.Status] || lead.Status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-900 mb-2">Potencial de Fechamento</h3>
                <p className="text-sm text-green-700 mb-3">
                  Estimativa baseada na taxa de conversão histórica aplicada ao pipeline ativo:
                </p>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(metrics.potentialValue)}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Cálculo Detalhado:</h4>
                <div className="bg-muted/50 p-4 rounded space-y-2">
                  <div className="flex justify-between">
                    <span>Pipeline Ativo:</span>
                    <span className="font-medium">{formatCurrency(metrics.activePipelineValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Conversão Histórica:</span>
                    <span className="font-medium">{metrics.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-green-600 font-bold">
                    <span>Potencial Estimado:</span>
                    <span>{formatCurrency(metrics.potentialValue)}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground bg-amber-50 p-3 rounded border border-amber-200">
                  <p className="font-medium text-amber-800 mb-1">💡 Como funciona:</p>
                  <p className="text-amber-700">
                    A taxa de conversão é calculada com base nos leads já finalizados: {metrics.wonLeads} ganhos
                    de {metrics.totalLeads} leads totais = {metrics.conversionRate.toFixed(1)}%.
                    Aplicamos essa taxa sobre o valor do pipeline ativo para estimar o potencial.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setModalOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}