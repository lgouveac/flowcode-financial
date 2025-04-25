
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailCCRecipientsManagerProps {
  open: boolean;
  onClose: () => void;
}

export const EmailCCRecipientsManager = ({
  open,
  onClose
}: EmailCCRecipientsManagerProps) => {
  const { toast } = useToast();
  const [recipients, setRecipients] = useState<{id: string, email: string}[]>([]);
  const [newRecipient, setNewRecipient] = useState("");

  useEffect(() => {
    const fetchRecipients = async () => {
      const { data, error } = await supabase
        .from('email_cc_recipients')
        .select('id, email')
        .eq('is_active', true);

      if (error) {
        toast({
          title: "Erro ao carregar destinatários",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setRecipients(data || []);
      }
    };

    if (open) {
      fetchRecipients();
    }
  }, [open]);

  const addRecipient = async () => {
    if (newRecipient && !recipients.some(r => r.email === newRecipient)) {
      if (!isValidEmail(newRecipient)) {
        toast({
          title: "Email inválido",
          description: "Por favor, insira um email válido.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('email_cc_recipients')
        .insert({ email: newRecipient, is_active: true })
        .select();

      if (error) {
        toast({
          title: "Erro ao adicionar destinatário",
          description: error.message,
          variant: "destructive"
        });
      } else if (data) {
        setRecipients([...recipients, data[0]]);
        setNewRecipient("");
      }
    }
  };

  const removeRecipient = async (recipientId: string) => {
    const { error } = await supabase
      .from('email_cc_recipients')
      .update({ is_active: false })
      .eq('id', recipientId);

    if (error) {
      toast({
        title: "Erro ao remover destinatário",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setRecipients(recipients.filter((recipient) => recipient.id !== recipientId));
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Destinatários em Cópia (CC)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              className="col-span-3"
            />
          </div>
          <Button onClick={addRecipient} disabled={!newRecipient}>
            Adicionar Destinatário
          </Button>
        </div>
        <div className="space-y-4">
          {recipients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell>{recipient.email}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeRecipient(recipient.id)}>
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Nenhum destinatário CC adicionado.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
