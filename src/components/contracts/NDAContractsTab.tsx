import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NDADialog } from "./NDADialog";
import { Shield, Send, History, Users, UserCheck } from "lucide-react";

export function NDAContractsTab() {
  const [ndaDialogOpen, setNdaDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setNdaDialogOpen(true)}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Enviar NDA
            </CardTitle>
            <CardDescription>
              Envie um acordo de confidencialidade para clientes ou funcionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setNdaDialogOpen(true)}>
              <Shield className="h-4 w-4 mr-2" />
              Novo NDA
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Histórico
            </CardTitle>
            <CardDescription>
              Visualize NDAs enviados anteriormente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              <History className="h-4 w-4 mr-2" />
              Ver Histórico
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Em breve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Status
            </CardTitle>
            <CardDescription>
              Acompanhe o status dos NDAs enviados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              <Shield className="h-4 w-4 mr-2" />
              Ver Status
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Em breve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              NDAs para Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Envie acordos de confidencialidade para clientes antes de compartilhar:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                Informações comerciais sensíveis
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                Estratégias de negócio
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                Propostas detalhadas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                Dados técnicos proprietários
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              NDAs para Funcionários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Proteja informações confidenciais da empresa com funcionários:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                Dados de clientes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                Processos internos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                Informações financeiras
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                Segredos comerciais
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards (placeholder for future implementation) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">NDAs Enviados</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <Send className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assinados</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <Shield className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <History className="h-4 w-4 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Este Mês</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <NDADialog
        open={ndaDialogOpen}
        onClose={() => setNdaDialogOpen(false)}
      />
    </div>
  );
}