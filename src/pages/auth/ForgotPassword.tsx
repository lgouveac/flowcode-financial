
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await resetPassword(email);
    
    setIsLoading(false);
    
    if (!error) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Recuperar senha</CardTitle>
          <CardDescription>
            Informe seu e-mail para receber um link de recuperação
          </CardDescription>
        </CardHeader>
        {isSubmitted ? (
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Enviamos um e-mail com as instruções para recuperar sua senha.
              </AlertDescription>
            </Alert>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Não recebeu o e-mail? Verifique sua caixa de spam ou{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                envie novamente
              </Button>
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Lembrou sua senha?{" "}
                <Link to="/auth/login" className="text-primary hover:underline">
                  Voltar para o login
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
