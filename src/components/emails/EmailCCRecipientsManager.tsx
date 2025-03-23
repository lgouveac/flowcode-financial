
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EmailCCRecipient {
  id: string;
  email: string;
  description: string;
  is_active: boolean;
}

export const EmailCCRecipientsManager = () => {
  const [recipients, setRecipients] = useState<EmailCCRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchRecipients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_cc_recipients")
        .select("*")
        .order("email");

      if (error) {
        throw error;
      }

      setRecipients(data || []);
    } catch (error: any) {
      console.error("Error fetching CC recipients:", error);
      toast({
        title: "Erro ao carregar destinatários CC",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, []);

  const handleAddRecipient = async () => {
    if (!newEmail || !validateEmail(newEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor, forneça um endereço de email válido.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from("email_cc_recipients")
        .insert({
          email: newEmail,
          description: newDescription,
          is_active: true,
        })
        .select();

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Email já existe",
            description: "Este endereço de email já está na lista.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setNewEmail("");
        setNewDescription("");
        fetchRecipients();
        toast({
          title: "Destinatário adicionado",
          description: `${newEmail} foi adicionado aos destinatários CC.`,
        });
        setAddDialogOpen(false);
      }
    } catch (error: any) {
      console.error("Error adding CC recipient:", error);
      toast({
        title: "Erro ao adicionar destinatário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteRecipient = async (id: string, email: string) => {
    try {
      const { error } = await supabase
        .from("email_cc_recipients")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setRecipients(recipients.filter(recipient => recipient.id !== id));
      toast({
        title: "Destinatário removido",
        description: `${email} foi removido da lista de destinatários CC.`,
      });
    } catch (error: any) {
      console.error("Error deleting CC recipient:", error);
      toast({
        title: "Erro ao remover destinatário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const toggleRecipientStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("email_cc_recipients")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setRecipients(
        recipients.map(recipient =>
          recipient.id === id ? { ...recipient, is_active: !isActive } : recipient
        )
      );

      toast({
        title: isActive ? "Destinatário desativado" : "Destinatário ativado",
        description: `O status do destinatário foi alterado.`,
      });
    } catch (error: any) {
      console.error("Error toggling recipient status:", error);
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Destinatários CC (Cópia)</span>
          <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        </CardTitle>
        <CardDescription>
          Emails que receberão cópias de todas as notificações enviadas para funcionários e clientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Carregando destinatários...</div>
        ) : recipients.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum destinatário CC configurado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map(recipient => (
                <TableRow key={recipient.id}>
                  <TableCell>{recipient.email}</TableCell>
                  <TableCell>{recipient.description || "—"}</TableCell>
                  <TableCell>
                    <div 
                      className={`px-2 py-1 rounded text-xs inline-block ${
                        recipient.is_active 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {recipient.is_active ? "Ativo" : "Inativo"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRecipientStatus(recipient.id, recipient.is_active)}
                      >
                        {recipient.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRecipient(recipient.id, recipient.email)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Destinatário CC</DialogTitle>
              <DialogDescription>
                Adicione um endereço de email que receberá cópia de todas as notificações enviadas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  placeholder="Ex: Departamento Financeiro"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddRecipient} disabled={isAdding}>
                {isAdding ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
