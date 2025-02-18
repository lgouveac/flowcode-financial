
import { Button } from "@/components/ui/button";
import { PlusIcon, UserIcon, BarChartIcon, WalletIcon, ReceiptIcon, UsersIcon, MailIcon } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { toast } = useToast();
  const location = useLocation();

  const navigation = [
    { path: "/", icon: BarChartIcon, label: "Visão Geral" },
    { path: "/clients", icon: UserIcon, label: "Clientes" },
    { path: "/employees", icon: UsersIcon, label: "Funcionários" },
    { path: "/receivables", icon: ReceiptIcon, label: "Recebimentos" },
    { path: "/emails", icon: MailIcon, label: "E-mails" },
    { path: "/cashflow", icon: WalletIcon, label: "Fluxo de Caixa" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container border-t border-border/40">
          <div className="grid grid-cols-6 -mb-px">
            {navigation.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  isActive(path)
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="container pt-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

export default Index;
