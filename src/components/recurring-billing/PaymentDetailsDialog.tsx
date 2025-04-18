
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmailTemplate } from "@/types/email";
import { EmailPreview } from "./EmailPreview";

interface PaymentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  billing: any;
  templates?: EmailTemplate[];
  clientName?: string;
}

export const PaymentDetailsDialog = ({
  open,
  onClose,
  onUpdate,
  billing,
  templates = [],
  clientName,
}: PaymentDetailsDialogProps) => {
  const [status, setStatus] = useState(billing?.status || "pending");
  const [emailTemplate, setEmailTemplate] = useState<string>(billing?.email_template || "");
  const [disableNotifications, setDisableNotifications] = useState(billing?.disable_notifications || false);
  const { toast } = useToast();

  useEffect(() => {
    if (billing) {
      setStatus(billing.status);
      setEmailTemplate(billing.email_template || "");
      setDisableNotifications(billing.disable_notifications || false);
    }
  }, [billing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from("recurring_billing")
      .update({ 
        status,
        email_template: emailTemplate,
        disable_notifications: disableNotifications
      })
      .eq("id", billing.id);

    if (error) {
      console.error("Error updating billing:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o recebimento.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Recebimento atualizado com sucesso.",
    });

    onUpdate();
    onClose();
  };

  const filteredTemplates = templates.filter(
    (template) => template.type === "clients" && template.subtype === "recurring"
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do Recebimento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="disable_notifications"
              checked={disableNotifications}
              onCheckedChange={(checked) => setDisableNotifications(checked as boolean)}
            />
            <Label htmlFor="disable_notifications">
              Desativar notificações automáticas
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Template de Email</Label>
            <Select 
              value={emailTemplate} 
              onValueChange={setEmailTemplate}
              disabled={disableNotifications}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o template" />
              </SelectTrigger>
              <SelectContent>
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhum template disponível
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {emailTemplate && !disableNotifications && (
            <EmailPreview
              selectedTemplate={emailTemplate}
              templates={templates}
              clientName={clientName}
              amount={billing?.amount}
              dueDay={billing?.due_day}
              description={billing?.description}
              installments={billing?.installments}
              paymentMethod={billing?.payment_method}
            />
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
