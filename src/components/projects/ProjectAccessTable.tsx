import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, User, UserCheck, Loader2 } from "lucide-react";
import { useProjectAccess } from "@/hooks/useProjectAccess";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectAccess, NewProjectAccess } from "@/types/project";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectAccessTableProps {
  projectId: number;
}

export function ProjectAccessTable({ projectId }: ProjectAccessTableProps) {
  const { accesses, loading, createAccess, updateAccess, deleteAccess } = useProjectAccess(projectId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState<ProjectAccess | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; full_name?: string; email?: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [accessType, setAccessType] = useState<'user' | 'employee'>('user');
  const [selectedUserId, setSelectedUserId] = useState<string>("none");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("none");
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit' | 'admin'>('view');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers((data || []) as Array<{ id: string; full_name?: string; email?: string }>);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email')
        .order('name', { ascending: true });

      if (error) throw error;
      setEmployees((data || []) as Array<{ id: string; name: string; email?: string }>);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleOpenDialog = (access?: ProjectAccess) => {
    if (access) {
      setEditingAccess(access);
      setAccessType(access.user_id ? 'user' : 'employee');
      setSelectedUserId(access.user_id || "none");
      setSelectedEmployeeId(access.employee_id || "none");
      setAccessLevel(access.access_level);
    } else {
      setEditingAccess(null);
      setAccessType('user');
      setSelectedUserId("none");
      setSelectedEmployeeId("none");
      setAccessLevel('view');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (accessType === 'user' && selectedUserId === "none") {
      toast({
        title: "Erro",
        description: "Selecione um usuário.",
        variant: "destructive",
      });
      return;
    }

    if (accessType === 'employee' && selectedEmployeeId === "none") {
      toast({
        title: "Erro",
        description: "Selecione um funcionário.",
        variant: "destructive",
      });
      return;
    }

    const accessData: NewProjectAccess = {
      project_id: projectId,
      user_id: accessType === 'user' && selectedUserId !== "none" ? selectedUserId : undefined,
      employee_id: accessType === 'employee' && selectedEmployeeId !== "none" ? selectedEmployeeId : undefined,
      access_level: accessLevel,
    };

    if (editingAccess) {
      await updateAccess(editingAccess.id, accessData);
    } else {
      await createAccess(accessData);
    }

    setDialogOpen(false);
    setEditingAccess(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este acesso?")) {
      await deleteAccess(id);
    }
  };

  const getAccessLevelBadge = (level: string) => {
    const colors = {
      view: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      edit: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    const labels = {
      view: "Visualizar",
      edit: "Editar",
      admin: "Admin",
    };
    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {labels[level as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gerenciar Acessos</CardTitle>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Acesso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : accesses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum acesso configurado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accesses.map((access) => (
                  <TableRow key={access.id}>
                    <TableCell>
                      {access.user_id ? (
                        <User className="h-4 w-4 text-blue-600" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      {access.user?.full_name || access.employee?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {access.user?.email || access.employee?.email || "N/A"}
                    </TableCell>
                    <TableCell>
                      {getAccessLevelBadge(access.access_level)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(access.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(access)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(access.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para adicionar/editar acesso */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccess ? "Editar Acesso" : "Adicionar Acesso"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo de Acesso</Label>
              <Select value={accessType} onValueChange={(v) => setAccessType(v as 'user' | 'employee')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="employee">Funcionário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accessType === 'user' ? (
              <div>
                <Label>Usuário</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email || user.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Funcionário</Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Nível de Acesso</Label>
              <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as 'view' | 'edit' | 'admin')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Visualizar</SelectItem>
                  <SelectItem value="edit">Editar</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingAccess ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}




