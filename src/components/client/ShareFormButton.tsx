
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2Icon, CheckIcon, CopyIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export const ShareFormButton = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const baseUrl = window.location.origin;
  const formUrl = `${baseUrl}/register-client`;
  
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
          <DialogTitle>Compartilhar Formulário de Cadastro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
              Compartilhe este link com seus clientes para que eles possam preencher o formulário de cadastro diretamente.
              Os dados enviados serão automaticamente adicionados à sua lista de clientes.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
