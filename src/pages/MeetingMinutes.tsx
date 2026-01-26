import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, Search, Edit, Trash2, ChevronDown, ChevronUp, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AtaCall {
  id: string;
  title: string;
  content: string;
  client_id: string | null;
  created_at: string;
  updated_at: string;
  clients?: {
    id: string;
    name: string;
  } | null;
}

interface Client {
  id: string;
  name: string;
}

export default function MeetingMinutes() {
  const [atas, setAtas] = useState<AtaCall[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("all");
  const [newAtaOpen, setNewAtaOpen] = useState(false);
  const [editingAta, setEditingAta] = useState<AtaCall | null>(null);
  const [expandedAtas, setExpandedAtas] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    client_id: ""
  });

  useEffect(() => {
    fetchAtas();
    fetchClients();
  }, []);

  const fetchAtas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ata_calls')
        .select(`
          *,
          clients (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAtas(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar atas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as atas de reunião.",
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

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o título e o conteúdo da ata.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const ataData: any = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        client_id: formData.client_id && formData.client_id !== "none" ? formData.client_id : null,
      };

      if (editingAta) {
        // Atualizar ata existente
        const { error } = await supabase
          .from('ata_calls')
          .update(ataData)
          .eq('id', editingAta.id);

        if (error) throw error;

        toast({
          title: "Ata atualizada",
          description: "A ata de reunião foi atualizada com sucesso.",
        });
      } else {
        // Criar nova ata
        const { error } = await supabase
          .from('ata_calls')
          .insert([ataData]);

        if (error) throw error;

        toast({
          title: "Ata criada",
          description: "A nova ata de reunião foi criada com sucesso.",
        });
      }

      setNewAtaOpen(false);
      setEditingAta(null);
      setFormData({ title: "", content: "", client_id: "" });
      fetchAtas();
    } catch (error: any) {
      console.error('Erro ao salvar ata:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a ata.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta ata? Esta ação é irreversível.")) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('ata_calls')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Ata excluída",
        description: "A ata de reunião foi removida com sucesso.",
      });

      fetchAtas();
    } catch (error: any) {
      console.error('Erro ao excluir ata:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a ata.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ata: AtaCall) => {
    setEditingAta(ata);
    setFormData({
      title: ata.title,
      content: ata.content,
      client_id: ata.client_id || "none"
    });
    setNewAtaOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedAtas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredAtas = atas.filter(ata => {
    const matchesSearch = ata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ata.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClientFilter === "all" || 
                         (selectedClientFilter === "none" && !ata.client_id) ||
                         ata.client_id === selectedClientFilter;
    return matchesSearch && matchesClient;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Atas de Reunião
          </h1>
          <p className="text-muted-foreground">
            Gerencie as atas de reunião e vincule aos clientes
          </p>
        </div>
        <Button onClick={() => {
          setEditingAta(null);
          setFormData({ title: "", content: "", client_id: "" });
          setNewAtaOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ata
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por título ou conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-filter">Filtrar por Cliente</Label>
              <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter}>
                <SelectTrigger id="client-filter">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  <SelectItem value="none">Sem cliente vinculado</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Atas */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando atas...</p>
        </div>
      ) : filteredAtas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || selectedClientFilter !== "all" 
                ? "Nenhuma ata encontrada com os filtros aplicados."
                : "Nenhuma ata de reunião cadastrada ainda."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAtas.map((ata) => {
            const isExpanded = expandedAtas.has(ata.id);
            return (
              <Card key={ata.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{ata.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(ata.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        {ata.clients && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {ata.clients.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(ata.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(ata)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ata.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted p-4 rounded-md">
                        {ata.content}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog para criar/editar ata */}
      <Dialog open={newAtaOpen} onOpenChange={(open) => {
        setNewAtaOpen(open);
        if (!open) {
          setEditingAta(null);
          setFormData({ title: "", content: "", client_id: "" });
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAta ? "Editar Ata de Reunião" : "Nova Ata de Reunião"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da ata de reunião. Você pode vincular a um cliente opcionalmente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Reunião de alinhamento - Projeto X"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Digite o conteúdo completo da ata de reunião..."
                rows={10}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                O conteúdo será exibido ao expandir o card da ata.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente (Opcional)</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Selecione um cliente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewAtaOpen(false);
                  setEditingAta(null);
                  setFormData({ title: "", content: "", client_id: "" });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : editingAta ? "Atualizar" : "Criar Ata"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

