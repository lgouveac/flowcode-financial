import { useState, useEffect } from "react";
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
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState("");

  useEffect(() => {
    // Load recipients from local storage on component mount
    const storedRecipients = localStorage.getItem("ccRecipients");
    if (storedRecipients) {
      setRecipients(JSON.parse(storedRecipients));
    }
  }, []);

  useEffect(() => {
    // Save recipients to local storage whenever the recipients state changes
    localStorage.setItem("ccRecipients", JSON.stringify(recipients));
  }, [recipients]);

  const addRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      if (!isValidEmail(newRecipient)) {
        toast({
          title: "Email inválido",
          description: "Por favor, insira um email válido.",
          variant: "destructive",
        });
        return;
      }
      setRecipients([...recipients, newRecipient]);
      setNewRecipient("");
    }
  };

  const removeRecipient = (recipientToRemove: string) => {
    setRecipients(recipients.filter((recipient) => recipient !== recipientToRemove));
  };

  const isValidEmail = (email: string): boolean => {
    // Basic email validation regex
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
                  <TableRow key={recipient}>
                    <TableCell>{recipient}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeRecipient(recipient)}>
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
