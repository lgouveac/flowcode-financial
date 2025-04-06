
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, LogOutIcon, MenuIcon } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/auth/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { toast } = useToast();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, signOut, profile } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

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

  // Mobile navigation component
  const MobileNav = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          aria-label="Menu"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[75vw] max-w-xs p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <img 
              src="/lovable-uploads/86bceaf8-2d8e-4f71-812c-f3e40ccf2e67.png" 
              alt="FlowCode Logo" 
              className="h-8 mb-4" 
            />
            {profile && (
              <div className="flex items-center gap-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{profile?.full_name || 'Usuário'}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user?.email}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-auto py-2">
            <nav className="space-y-1 px-2">
              {navigation.map(({ path, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/"}
                  className={({ isActive }) => `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          
          <div className="border-t p-4">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={handleLogout}
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              Sair
            </Button>
            
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm">Tema</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? (
                  <MoonIcon className="h-4 w-4" />
                ) : (
                  <SunIcon className="h-4 w-4" />
                )}
                <span className="sr-only">Alternar tema</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-secondary border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center md:w-auto w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/86bceaf8-2d8e-4f71-812c-f3e40ccf2e67.png" 
                  alt="FlowCode Logo" 
                  className="h-8 md:h-10 mr-4" 
                />
                <MobileNav />
              </div>
              <nav className="hidden md:flex -mb-px space-x-4 lg:space-x-8">
                {navigation.map(({ path, label }) => (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === "/"}
                    className={({ isActive }) => `flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors hover:text-foreground ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
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

      <main className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

export default Index;
