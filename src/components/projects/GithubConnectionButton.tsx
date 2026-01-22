import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Github, CheckCircle2 } from 'lucide-react';
import { useGithubToken } from '@/hooks/useGithubToken';
import { GithubTokenDialog } from './GithubTokenDialog';
import { useToast } from '@/hooks/use-toast';

export function GithubConnectionButton() {
  const { token, repos, removeToken, loading, isAuthenticated } = useGithubToken();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
          GitHub Conectado ({repos.length} repositórios)
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            removeToken();
            toast({
              title: 'GitHub desconectado',
              description: 'Token removido com sucesso.',
            });
          }}
        >
          Desconectar
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setDialogOpen(true)} 
        disabled={loading}
        size="sm"
      >
        <Github className="h-4 w-4 mr-2" />
        Conectar GitHub
      </Button>
      <GithubTokenDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

