
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';

export default function VerifyEmail() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Verifique seu e-mail</CardTitle>
          <CardDescription>
            Enviamos um link de confirmação para o seu e-mail
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Para concluir seu cadastro, clique no link de confirmação que enviamos para seu e-mail.
            Se não encontrar o e-mail, verifique sua caixa de spam.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link to="/auth/login">
              Voltar para o login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
