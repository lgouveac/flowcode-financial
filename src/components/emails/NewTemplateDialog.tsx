
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@/types/email";

interface NewTemplateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewTemplateDialog({ open, onClose }: NewTemplateDialogProps) {
  const [type, setType] = useState<'clients' | 'employees'>('clients');
  const [subtype, setSubtype] = useState('recurring');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !subject || !content) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para criar o template.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Implementation will be added later
      console.log("Creating template:", { type, subtype, name, subject, content });
      
      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso!"
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Erro ao criar template",
        description: "Não foi possível criar o template. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Novo Template de E-mail</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(value: 'clients' | 'employees') => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clients">Clientes</SelectItem>
                  <SelectItem value="employees">Funcionários</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Subtipo</Label>
              <Select value={subtype} onValueChange={setSubtype}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {type === 'clients' ? (
                    <>
                      <SelectItem value="recurring">Cobrança Recorrente</SelectItem>
                      <SelectItem value="oneTime">Cobrança Pontual</SelectItem>
                      <SelectItem value="reminder">Lembrete de Pagamento</SelectItem>
                      <SelectItem value="contract">Contrato</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="invoice">Nota Fiscal</SelectItem>
                      <SelectItem value="hours">Horas</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Nome do Template</Label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Template Padrão de Cobrança"
            />
          </div>

          <div>
            <Label>Assunto</Label>
            <Input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Cobrança - {mes_referencia}"
            />
          </div>

          <div>
            <Label>Conteúdo</Label>
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite o conteúdo do email aqui..."
              className="min-h-[200px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
