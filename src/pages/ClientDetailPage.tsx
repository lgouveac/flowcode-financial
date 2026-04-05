import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Phone, Building2, User, Edit, FolderOpen, Plus, DollarSign } from "lucide-react";
import type { Client } from "@/types/client";
import type { Project } from "@/types/project";
import { EditClientDialog } from "@/components/EditClientDialog";

const statusLabels: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  overdue: "Inadimplente",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  overdue: "bg-red-100 text-red-800",
};

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (clientId) fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientRes, projectsRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", clientId).single(),
        supabase.from("projetos").select("*").eq("client_id", clientId).order("name"),
      ]);

      if (clientRes.error) throw clientRes.error;
      setClient(clientRes.data as Client);
      setProjects((projectsRes.data as Project[]) || []);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os dados do cliente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Cliente não encontrado.
      </div>
    );
  }

  const projectStatusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
  };

  const projectStatusLabels: Record<string, string> = {
    active: "Ativo",
    paused: "Pausado",
    completed: "Concluído",
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb items={[
        { label: "Clientes", href: "/clients" },
        { label: client.name },
      ]} />

      {/* Client Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <Badge className={statusColors[client.status]}>
              {statusLabels[client.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {client.email && (
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{client.email}</span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{client.phone}</span>
            )}
            <span className="flex items-center gap-1">
              {client.type === "pj" ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              {client.type === "pj" ? "Pessoa Jurídica" : "Pessoa Física"}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">R$ {(client.total_billing || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Projetos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Projetos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projetos</h2>
          <Button size="sm" onClick={() => navigate("/projects")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Nenhum projeto vinculado a este cliente.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                      <Badge className={projectStatusColors[project.status] || "bg-gray-100 text-gray-800"}>
                        {projectStatusLabels[project.status] || project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      {editOpen && (
        <EditClientDialog
          client={client}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
