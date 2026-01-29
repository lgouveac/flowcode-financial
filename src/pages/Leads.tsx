import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsKanban } from "@/components/leads/LeadsKanban";
import { LeadsDashboard } from "@/components/leads/LeadsDashboard";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { List, Grid, Search, Plus, Users, BarChart3, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Leads() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pipeline');

  return (
    <div className="space-section">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2">
          <Users className="h-6 w-6 sm:h-5 sm:w-5" />
          Gestão de Leads
        </h1>
        <p className="text-muted-foreground text-responsive mt-2">
          Gerencie seus leads e acompanhe o pipeline de vendas
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pipeline" onValueChange={setActiveTab} className="space-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs Navigation */}
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          {/* Controls - shown only on pipeline tab */}
          {activeTab === 'pipeline' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>

              {/* View Toggle */}
              <div className="flex bg-muted rounded-lg p-1 gap-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="min-h-[44px] sm:min-h-[36px] px-3"
                  title="Visualização em Lista"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="min-h-[44px] sm:min-h-[36px] px-3"
                  title="Visualização em Kanban"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>

              {/* Add Lead */}
              <Button 
                onClick={() => setNewLeadOpen(true)}
                className="w-full sm:w-auto touch-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="pipeline" className="space-y-6">
          {/* Content */}
          {viewMode === 'list' ? (
            <LeadsTable searchTerm={searchTerm} />
          ) : (
            <LeadsKanban searchTerm={searchTerm} />
          )}
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