
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TestEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testEmail: string;
  onTestEmailChange: (email: string) => void;
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
  testData?: Array<{ id: string; name: string; email: string }>;
  onSendTest: () => void;
  type: 'clients' | 'employees';
}

export const TestEmailDialog = ({
  open,
  onOpenChange,
  testEmail,
  onTestEmailChange,
  selectedId,
  onSelectedIdChange,
  testData,
  onSendTest,
  type,
}: TestEmailDialogProps) => {
  const isClient = type === 'clients';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar E-mail de Teste</DialogTitle>
          <DialogDescription>
            Durante o período de testes, o Resend só permite enviar e-mails para endereços verificados.
            Certifique-se de usar um e-mail que você tenha acesso.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">E-mail para Teste</Label>
            <Input
              id="test-email"
              placeholder="seu.email@exemplo.com"
              type="email"
              value={testEmail}
              onChange={(e) => onTestEmailChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>
              Selecionar {isClient ? "Cliente" : "Funcionário"} para Dados de Teste
            </Label>
            <Select value={selectedId} onValueChange={onSelectedIdChange}>
              <SelectTrigger>
                <SelectValue placeholder={`Selecione um ${isClient ? "cliente" : "funcionário"}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Usar dados de exemplo</SelectItem>
                {testData?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSendTest}>
            Enviar Teste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
