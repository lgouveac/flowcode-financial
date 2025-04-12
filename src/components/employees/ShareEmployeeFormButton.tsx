
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2Icon, CheckIcon, CopyIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ShareEmployeeFormButton = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const baseUrl = window.location.origin;
  const formUrl = `${baseUrl}/register-employee`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link do formulário foi copiado para a área de transferência.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link para a área de transferência.",
        variant: "destructive",
      });
    }
  };

  const generateQRCode = () => {
    // Generate a QR code URL using a free QR code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(formUrl)}`;
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2Icon className="h-4 w-4" />
          Compartilhar Formulário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Formulário de Cadastro de Colaborador</DialogTitle>
          <DialogDescription>
            Compartilhe este formulário para que as pessoas possam se cadastrar como colaboradores diretamente.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="py-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="form-link">Link do formulário</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="form-link"
                  value={formUrl}
                  readOnly
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  size="icon" 
                  variant="outline"
                  onClick={copyToClipboard}
                  title={copied ? "Copiado!" : "Copiar link"}
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Envie este link por e-mail, WhatsApp ou qualquer outro meio para que as pessoas possam preencher o formulário.
                Os dados enviados serão automaticamente adicionados à sua lista de colaboradores.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="qrcode" className="space-y-4">
            <div className="flex justify-center py-4">
              <div className="border p-4 rounded-lg bg-white">
                <img 
                  src={generateQRCode()} 
                  alt="QR Code para formulário de cadastro de colaborador" 
                  className="w-48 h-48"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                As pessoas podem escanear este QR code com a câmera do celular para acessar o formulário de cadastro de colaborador.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
