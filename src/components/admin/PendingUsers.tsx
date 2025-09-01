import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, Mail, User } from "lucide-react";

interface PendingUser {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  status: string;
}

export function PendingUsers() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      // Por enquanto, usar uma abordagem mais simples
      // Criar uma tabela "user_approvals" para gerenciar aprovações
      const { data, error } = await supabase
        .from('user_approvals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar usuários:', error);
        // Se a tabela não existir, não mostrar erro
        if (error.code !== 'PGRST116') {
          toast({
            title: "Erro",
            description: "Não foi possível carregar usuários pendentes.",
            variant: "destructive",
          });
        }
        setPendingUsers([]);
        return;
      }

      setPendingUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários pendentes:', error);
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string, email: string) => {
    setProcessingUserId(userId);
    
    try {
      // Atualizar status na tabela user_approvals
      const { error } = await supabase
        .from('user_approvals')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuário Aprovado",
        description: `${email} foi aprovado e pode agora fazer login.`,
      });

      // Remover da lista
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o usuário.",
        variant: "destructive",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRejectUser = async (userId: string, email: string) => {
    setProcessingUserId(userId);
    
    try {
      // Atualizar status na tabela user_approvals
      const { error } = await supabase
        .from('user_approvals')
        .update({ status: 'rejected', rejected_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuário Rejeitado",
        description: `${email} foi rejeitado.`,
      });

      // Remover da lista
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o usuário.",
        variant: "destructive",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Usuários Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Usuários Pendentes de Aprovação
          </CardTitle>
          {pendingUsers.length > 0 && (
            <Badge variant="destructive" className="bg-orange-500">
              {pendingUsers.length} pendente{pendingUsers.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <h3 className="text-lg font-medium mb-2">Nenhum usuário pendente</h3>
            <p className="text-muted-foreground">
              Todos os cadastros foram processados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {user.full_name || "Nome não informado"}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Cadastrado em:</p>
                      <p>{formatDate(user.created_at)}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveUser(user.id, user.email)}
                        disabled={processingUserId === user.id}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectUser(user.id, user.email)}
                        disabled={processingUserId === user.id}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={fetchPendingUsers}
                size="sm"
              >
                Atualizar Lista
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}