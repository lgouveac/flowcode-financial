
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, LogOutIcon, UserIcon } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/auth/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Index = () => {
  const { toast } = useToast();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, signOut, profile } = useAuth();

  const navigation = [
    { path: "/", label: "Visão Geral" },
    { path: "/clients", label: "Clientes" },
    { path: "/employees", label: "Funcionários" },
    { path: "/receivables", label: "Recebimentos" },
    { path: "/emails", label: "E-mails" },
    { path: "/cashflow", label: "Fluxo de Caixa" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Obter as iniciais do nome do usuário para o avatar
  const getInitials = () => {
    if (!profile?.full_name) return 'U';
    
    return profile.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <nav className="flex -mb-px space-x-8">
            {navigation.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors hover:text-foreground ${
                  isActive(path)
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-primary/30'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-muted"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? (
                <MoonIcon className="h-4 w-4" />
              ) : (
                <SunIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Alternar tema</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-9 rounded-full p-0 hover:bg-muted"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="flex flex-col items-start">
                  <span className="font-medium">{profile?.full_name || 'Usuário'}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

export default Index;
