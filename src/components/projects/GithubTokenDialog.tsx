import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Key, Loader2 } from 'lucide-react';
import { useGithubToken } from '@/hooks/useGithubToken';
import { useToast } from '@/hooks/use-toast';

interface GithubTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GithubTokenDialog({ open, onOpenChange }: GithubTokenDialogProps) {
  const [tokenInput, setTokenInput] = useState('');
  const { setGithubToken, loading, error } = useGithubToken();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await setGithubToken(tokenInput.trim());
    
    if (result.success) {
      toast({
        title: 'GitHub conectado!',
        description: 'Token configurado com sucesso. Seus repositórios estão sendo carregados...',
      });
      setTokenInput('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Conectar GitHub com Personal Access Token
          </DialogTitle>
          <DialogDescription>
            Use um Personal Access Token do GitHub para acessar seus repositórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Personal Access Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-sm text-muted-foreground">
              O token será armazenado localmente no seu navegador.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Não tem um token?</span>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=FlowCode%20Financial"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              Criar token <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !tokenInput.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

