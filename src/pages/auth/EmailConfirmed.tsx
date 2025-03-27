
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/AuthContext';

export default function EmailConfirmed() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Show a welcome toast
    toast({
      title: 'E-mail confirmado',
      description: 'Seu e-mail foi confirmado com sucesso. Bem-vindo!',
    });

    // If user is already logged in, redirect to dashboard after a short delay
    if (user) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toast, navigate, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">E-mail confirmado!</CardTitle>
          <CardDescription>
            Sua conta foi ativada com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Agora você pode acessar todas as funcionalidades do sistema.
            {user ? ' Você será redirecionado automaticamente em instantes.' : ' Por favor, faça login para continuar.'}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link to={user ? '/' : '/auth/login'}>
              {user ? 'Ir para o dashboard' : 'Fazer login'}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
