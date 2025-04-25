
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TemplateForm } from "@/components/emails/TemplateForm";
import { EmailTemplate } from "@/types/email";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createTemplate } from "@/services/templateService";
import { useToast } from "@/hooks/use-toast";

interface NewTemplateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewTemplateDialog({ open, onClose }: NewTemplateDialogProps) {
  const [type, setType] = useState<'clients' | 'employees'>('clients');
  const [subtype, setSubtype] = useState<string>('recurring');
  const { toast } = useToast();

  const [template, setTemplate] = useState<Partial<EmailTemplate>>({
    name: '',
    subject: '',
    content: '',
    type: 'clients',
    subtype: 'recurring'
  });

  const handleInputChange = (field: keyof EmailTemplate, value: string) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value,
      type,
      subtype
    }));
  };

  const handleSave = async () => {
    try {
      await createTemplate(template);
      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso!"
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao criar template",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Template de Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Tipo de Template</Label>
              <Select 
                value={type} 
                onValueChange={(value: 'clients' | 'employees') => {
                  setType(value);
                  setSubtype(value === 'clients' ? 'recurring' : 'invoice');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clients">Template de Cliente</SelectItem>
                  <SelectItem value="employees">Template de Funcionário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subtipo</Label>
              <Select value={subtype} onValueChange={setSubtype}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o subtipo" />
                </SelectTrigger>
                <SelectContent>
                  {type === 'clients' ? (
                    <>
                      <SelectItem value="recurring">Cobrança Recorrente</SelectItem>
                      <SelectItem value="oneTime">Cobrança Pontual</SelectItem>
                      <SelectItem value="contract">Contrato</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="invoice">Template NF</SelectItem>
                      <SelectItem value="hours">Template Horas</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <TemplateForm
              type={type}
              currentType={subtype}
              template={template}
              onInputChange={handleInputChange}
              onSave={handleSave}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e, id) => {
                e.preventDefault();
                // Handle variable drops here if needed
              }}
              onTestEmail={() => {
                // Handle test email if needed
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
