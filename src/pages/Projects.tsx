import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, RefreshCw, Search, Filter, X, Moon, Sun } from "lucide-react";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { ProjectDetailDialog } from "@/components/projects/ProjectDetailDialog";
import { syncContractsToProjects } from "@/services/contractProjectSync";
import type { Project } from "@/types/project";
import { useTheme } from "@/components/ThemeProvider";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetailOpen, setProjectDetailOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log("🏗️ Starting projects fetch...");

      // Primeiro, sincronizar contratos para projetos (cria projetos que faltam)
      try {
        console.log("🔄 Running contract sync before fetching projects...");
        await syncContractsToProjects();
        console.log("✅ Contract sync completed");
      } catch (syncError) {
        console.error('❌ Error syncing contracts to projects:', syncError);
        // Não falha o carregamento se houver erro na sincronização
      }

      // Buscar TODOS os projetos (incluindo os criados manualmente e os gerados automaticamente)
      console.log("📊 Fetching all projects from database...");
      const { data, error } = await supabase
        .from('projetos')
        .select(`
          *,
          clients (
            id,
            name
          ),
          contratos!projetos_contract_id_fkey (
            id,
            scope,
            start_date,
            end_date,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("❌ Error fetching projects:", error);
        throw error;
      }

      console.log(`📋 Found ${data?.length || 0} total projects in database`);
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) {
        console.error("Error fetching clients:", error);
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'paused': return 'Pausado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Client filter
      const clientMatch = selectedClientId === "all" || project.client_id === selectedClientId;

      // Search filter
      const searchMatch = searchTerm === "" ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.contratos?.scope?.toLowerCase().includes(searchTerm.toLowerCase());

      return clientMatch && searchMatch;
    });
  }, [projects, selectedClientId, searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedClientId("all");
  };

  // Prepare client options for the combobox
  const clientOptions = useMemo(() => {
    return [
      { value: "all", label: "Todos os clientes" },
      ...clients.map(client => ({
        value: client.id,
        label: client.name
      }))
    ];
  }, [clients]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Projetos</h1>
            <p className="text-muted-foreground">Gerencie projetos e acompanhe horas trabalhadas</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setProjectDetailOpen(true);
  };

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      await syncContractsToProjects();
      await fetchProjects();
      toast({
        title: "Sincronização concluída",
        description: "Projetos foram sincronizados com os contratos.",
      });
    } catch (error) {
      console.error('Error in manual sync:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os projetos.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">Gerencie projetos e acompanhe horas trabalhadas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleForceSync}
            disabled={syncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          <Button onClick={() => setNewProjectOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome do projeto, descrição, cliente ou contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Combobox
            items={clientOptions}
            value={selectedClientId}
            onValueChange={setSelectedClientId}
            placeholder="Filtrar por cliente"
            searchPlaceholder="Buscar cliente..."
            emptyText="Nenhum cliente encontrado"
            className="w-[220px]"
          />

          {(searchTerm || selectedClientId !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {(searchTerm || selectedClientId !== "all") && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredProjects.length} de {projects.length} projetos
          {searchTerm && (
            <span> • Busca: "<span className="font-medium">{searchTerm}</span>"</span>
          )}
          {selectedClientId !== "all" && (
            <span> • Cliente: <span className="font-medium">
              {clients.find(c => c.id === selectedClientId)?.name}
            </span></span>
          )}
        </div>
      )}

      {filteredProjects.length === 0 && projects.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Tente ajustar os filtros ou termo de busca
            </p>
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro projeto para começar a acompanhar horas
            </p>
            <Button onClick={() => setNewProjectOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleProjectClick(project)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {project.clients && (
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-muted-foreground mr-2">Cliente:</span>
                    <span>{project.clients.name}</span>
                  </div>
                )}
                {project.contratos && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-muted-foreground mr-2">Contrato:</span>
                      <span className="truncate">{project.contratos.scope || `#${project.contratos.id}`}</span>
                    </div>


                    {(project.contratos.start_date || project.contratos.end_date) && (
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-muted-foreground mr-2">Período:</span>
                        <span className="text-xs">
                          {project.contratos.start_date && new Date(project.contratos.start_date).toLocaleDateString('pt-BR')}
                          {project.contratos.start_date && project.contratos.end_date && ' - '}
                          {project.contratos.end_date && new Date(project.contratos.end_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}

                    {project.contratos.status && (
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-muted-foreground mr-2">Status:</span>
                        <span className="capitalize text-xs px-2 py-1 rounded-full bg-muted">
                          {project.contratos.status}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onSuccess={() => {
          setNewProjectOpen(false);
          fetchProjects();
        }}
      />

      {selectedProject && (
        <ProjectDetailDialog
          project={selectedProject}
          open={projectDetailOpen}
          onClose={() => {
            setProjectDetailOpen(false);
            setSelectedProject(null);
          }}
          onRefresh={fetchProjects}
        />
      )}
    </div>
  );
}