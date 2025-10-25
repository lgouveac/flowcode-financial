import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsKanban } from "@/components/leads/LeadsKanban";
import { LeadsDashboard } from "@/components/leads/LeadsDashboard";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { List, Grid, Search, Plus, Users, BarChart3, Layers } from "lucide-react";

export default function Leads() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pipeline');

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
      <Tabs defaultValue="pipeline" onValueChange={setActiveTab} className="space-y-6">
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
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-64 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 pl-9 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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