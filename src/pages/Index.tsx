
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "@/components/ThemeProvider";

const Index = () => {
  const { toast } = useToast();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

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
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

export default Index;
