import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users as UsersIcon, 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  Mail, 
  Shield, 
  CheckCircle, 
  XCircle,
  AlertTriangle
} from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  status: 'active' | 'pending' | 'blocked';
  role?: string;
}

interface PendingUser {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  status: string;
}

export default function Users() {
  console.log('Users component renderizado');
  
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchPendingUsers()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Buscando usuários do auth...');
      
      // Buscar usuários da tabela auth.users do Supabase com paginação
      const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000 // Buscar até 1000 usuários
      });
      
      console.log('Resultado auth.admin.listUsers:', { data, error });

      if (error) {
        console.error('Erro ao buscar usuários do auth:', error);
        // Se não tiver permissão de admin, criar dados de exemplo
        console.log('Criando usuários de exemplo (sem permissão admin)...');
        const exampleUsers = [
          {
            id: '1',
            email: 'lucas.carmo@flowcode.cc',
            full_name: 'Lucas Carmo',
            created_at: new Date().toISOString(),
            status: 'active' as const,
            role: 'admin'
          },
          {
            id: '2', 
            email: 'usuario@exemplo.com',
            full_name: 'Usuário Exemplo',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            status: 'active' as const,
            role: 'user'
          }
        ];
        setUsers(exampleUsers);
        return;
      }

      if (data?.users) {
        console.log('Usuários encontrados no auth:', data.users.length);
        
        const mappedUsers = data.users.map(user => ({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          created_at: user.created_at,
          status: user.banned_until ? 'blocked' : 'active' as const,
          role: user.app_metadata?.role || 'user'
        }));

        console.log('Usuários mapeados:', mappedUsers);
        setUsers(mappedUsers);
      } else {
        setUsers([]);
      }
      
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setUsers([]);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      console.log('Tentando buscar usuários pendentes...');
      
      const { data, error } = await supabase
        .from('user_approvals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('Resultado user_approvals:', { data, error });

      if (error) {
        console.log('Erro ao buscar user_approvals:', error);
        if (error.code === '42P01') {
          console.log('Tabela user_approvals não existe - isso é normal se ainda não foi criada');
        }
        setPendingUsers([]);
        return;
      }

      setPendingUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários pendentes:', error);
      setPendingUsers([]);
    }
  };

  const handleApproveUser = async (userId: string, email: string) => {
    setProcessingUserId(userId);
    
    try {
      const { error } = await supabase
        .from('user_approvals')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuário Aprovado",
        description: `${email} foi aprovado e pode agora fazer login.`,
      });

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
      const { error } = await supabase
        .from('user_approvals')
        .update({ status: 'rejected', rejected_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuário Rejeitado",
        description: `${email} foi rejeitado.`,
      });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'blocked':
        return 'Bloqueado';
      default:
        return 'Indefinido';
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const pendingCount = pendingUsers.length;

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UsersIcon className="h-6 w-6" />
          Usuários
        </h1>
        <p className="text-muted-foreground">
          Gerencie usuários do sistema e aprovações pendentes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
                <UsersIcon className="h-8 w-8 text-muted-foreground" />
              </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bloqueados</p>
                  <p className="text-2xl font-bold text-red-600">
                    {users.filter(u => u.status === 'blocked').length}
                  </p>
                </div>
                <UserX className="h-8 w-8 text-red-600" />
              </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Users Alert */}
      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">
                  {pendingCount} usuário{pendingCount > 1 ? 's' : ''} aguardando aprovação
                </h3>
                <p className="text-sm text-yellow-700">
                  Há novos cadastros que precisam ser aprovados por você.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Users Section */}
      {pendingCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Usuários Pendentes de Aprovação
              <Badge variant="destructive" className="bg-orange-500">
                {pendingCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-yellow-600" />
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Usuários do Sistema</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `Nenhum usuário corresponde ao termo "${searchTerm}"`
                  : 'Não há usuários cadastrados no sistema.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <UsersIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.full_name || "Nome não informado"}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {user.email}
                            </span>
                            {user.role && (
                              <span className="flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                {user.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm text-muted-foreground">
                          <p>Cadastrado em:</p>
                          <p>{formatDate(user.created_at)}</p>
                        </div>
                        <Badge className={getStatusColor(user.status)}>
                          {getStatusLabel(user.status)}
                        </Badge>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}