
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
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex -mb-px space-x-8">
            {navigation.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive(path)
                    ? 'border-primary text-primary'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 min-h-[calc(100vh-10rem)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Index;
