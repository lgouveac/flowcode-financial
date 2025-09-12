import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface APIKeyDialogProps {
  currentApiKey?: string;
  onApiKeyChange: (apiKey: string) => void;
}

export const APIKeyDialog = ({ currentApiKey, onApiKeyChange }: APIKeyDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    if (apiKey.trim()) {
      // Salvar no localStorage
      localStorage.setItem('openai_api_key', apiKey.trim());
      onApiKeyChange(apiKey.trim());
      
      toast({
        title: "API Key Configurada",
        description: "Sua chave da OpenAI foi salva com sucesso!",
      });
    } else {
      // Remover do localStorage
      localStorage.removeItem('openai_api_key');
      onApiKeyChange('');
      
      toast({
        title: "API Key Removida",
        description: "A chave da OpenAI foi removida.",
      });
    }
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          {currentApiKey ? 'Configurar IA' : 'Ativar IA'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Assistente IA</DialogTitle>
          <DialogDescription>
            Configure sua API Key do OpenRouter para ativar o assistente financeiro inteligente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key do OpenRouter</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            <p className="font-medium mb-1">Como obter sua API Key:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Acesse <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline inline-flex items-center gap-1"
              >
                openrouter.ai/keys
                <ExternalLink className="h-3 w-3" />
              </a></li>
              <li>Faça login em sua conta OpenRouter</li>
              <li>Clique em "Create Key"</li>
              <li>Copie a chave e cole aqui</li>
            </ol>
          </div>
          
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
            <p className="font-medium mb-1">⚠️ Importante:</p>
            <p className="text-xs">
              Sua API Key é armazenada apenas no seu navegador e nunca é compartilhada. 
              OpenRouter tem modelos gratuitos e pagos - verifique os preços.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {apiKey.trim() ? 'Salvar' : 'Remover'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};