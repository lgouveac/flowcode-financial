import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsKanban } from "@/components/leads/LeadsKanban";
import { LeadsDashboard } from "@/components/leads/LeadsDashboard";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { List, Grid, Search, Plus, Users, BarChart3 } from "lucide-react";

export default function Leads() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Gestão de Leads
        </h1>
        <p className="text-muted-foreground">
          Gerencie seus leads e acompanhe o pipeline de vendas
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leads" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard Comercial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Leads</CardTitle>

                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>

                  {/* View Toggle */}
                  <div className="flex bg-muted rounded-lg p-1">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="px-3 py-1"
                      title="Visualização em Lista"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('kanban')}
                      className="px-3 py-1"
                      title="Visualização em Kanban"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Add Lead */}
                  <Button onClick={() => setNewLeadOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Lead
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {viewMode === 'list' ? (
                <LeadsTable searchTerm={searchTerm} />
              ) : (
                <LeadsKanban searchTerm={searchTerm} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <LeadsDashboard />
        </TabsContent>
      </Tabs>

      {/* New Lead Dialog */}
      <NewLeadDialog
        open={newLeadOpen}
        onClose={() => setNewLeadOpen(false)}
      />
    </div>
  );
}