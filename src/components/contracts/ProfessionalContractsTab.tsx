import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Users, Briefcase, FileCheck, Plus, Building, HandHeart } from "lucide-react";

export function ProfessionalContractsTab() {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Contratos de Funcionários
            </CardTitle>
            <CardDescription>
              Contratos de trabalho e documentos para funcionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Em breve
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Contratos de Freelancers
            </CardTitle>
            <CardDescription>
              Acordos com prestadores de serviços independentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              <FileCheck className="h-4 w-4 mr-2" />
              Criar Acordo
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Em breve
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <HandHeart className="h-5 w-5 text-green-600" />
              Parcerias Comerciais
            </CardTitle>
            <CardDescription>
              Acordos de parceria e colaboração comercial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              <Building className="h-4 w-4 mr-2" />
              Nova Parceria
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Em breve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contract Types Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Tipos de Contratos Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Contratos de Trabalho CLT</h4>
                  <p className="text-sm text-muted-foreground">
                    Contratos formais para funcionários registrados
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Contratos de Prestação de Serviços</h4>
                  <p className="text-sm text-muted-foreground">
                    Para freelancers e prestadores independentes
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Acordos de Parceria</h4>
                  <p className="text-sm text-muted-foreground">
                    Parcerias estratégicas com outras empresas
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Contratos de Estágio</h4>
                  <p className="text-sm text-muted-foreground">
                    Acordos para programas de estágio
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Recursos Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileCheck className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <h4 className="font-medium">Templates Personalizados</h4>
                  <p className="text-sm text-muted-foreground">
                    Modelos adaptáveis para diferentes tipos de profissionais
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <UserCheck className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <h4 className="font-medium">Gestão de Aprovações</h4>
                  <p className="text-sm text-muted-foreground">
                    Fluxo de aprovação para contratos profissionais
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Building className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <h4 className="font-medium">Integração com RH</h4>
                  <p className="text-sm text-muted-foreground">
                    Conectado ao sistema de recursos humanos
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <HandHeart className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <h4 className="font-medium">Renovação Automática</h4>
                  <p className="text-sm text-muted-foreground">
                    Lembretes e renovação automática de contratos
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Funcionários</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Freelancers</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <Briefcase className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Parcerias</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <HandHeart className="h-4 w-4 text-green-600" />
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
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}