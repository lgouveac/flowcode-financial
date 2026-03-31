
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  LogOut,
  X,
  User,
  Moon,
  Sun,
  Calculator,
  Shield,
  Target,
  FolderOpen,
  ClipboardList,
  Kanban,
  MoreHorizontal,
  KeyRound
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { FlowcodeLogo } from "@/components/ui/logo";
import { useAuth } from "@/components/auth/AuthContext";
import { usePermissions, UserRole } from "@/hooks/usePermissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SimpleChatWidget } from "@/components/ai-chat/SimpleChatWidget";

const navigation: { name: string; href: string; icon: typeof LayoutDashboard; roles: UserRole[] }[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ['admin', 'financial', 'employee'] },
  { name: "Clientes", href: "/clients", icon: Users, roles: ['admin', 'financial'] },
  { name: "Funcionários", href: "/employees", icon: UserCheck, roles: ['admin'] },
  { name: "Recebimentos", href: "/receivables", icon: Receipt, roles: ['admin', 'financial'] },
  { name: "Contratos", href: "/contracts", icon: FileText, roles: ['admin', 'financial'] },
  { name: "Projetos", href: "/projects", icon: FolderOpen, roles: ['admin', 'employee'] },
  { name: "Kanban de Atividades", href: "/tasks", icon: Kanban, roles: ['admin', 'employee'] },
  { name: "Atas de Reunião", href: "/meeting-minutes", icon: ClipboardList, roles: ['admin', 'employee'] },
  { name: "Pagamentos", href: "/payments", icon: DollarSign, roles: ['admin', 'financial'] },
  { name: "Fluxo de Caixa", href: "/cashflow", icon: TrendingUp, roles: ['admin', 'financial'] },
  { name: "Despesas Estimadas", href: "/estimated-expenses", icon: Calculator, roles: ['admin', 'financial'] },
  { name: "Leads", href: "/leads", icon: Target, roles: ['admin', 'financial'] },
  { name: "Cofre de Acessos", href: "/access-vault", icon: KeyRound, roles: ['admin'] },
  { name: "Usuários", href: "/users", icon: Shield, roles: ['admin'] },
];

// Bottom nav items - filtered by role at render time
const allBottomNavItems: { name: string; href: string; icon: typeof LayoutDashboard; roles: UserRole[] }[] = [
  { name: "Home", href: "/", icon: LayoutDashboard, roles: ['admin', 'financial', 'employee'] },
  { name: "Projetos", href: "/projects", icon: FolderOpen, roles: ['employee'] },
  { name: "Tarefas", href: "/tasks", icon: Kanban, roles: ['employee'] },
  { name: "Recebimentos", href: "/receivables", icon: Receipt, roles: ['admin', 'financial'] },
  { name: "Caixa", href: "/cashflow", icon: TrendingUp, roles: ['admin', 'financial'] },
  { name: "Clientes", href: "/clients", icon: Users, roles: ['admin', 'financial'] },
];

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { role } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNavigation = navigation.filter((item) => item.roles.includes(role));
  const bottomNavItems = allBottomNavItems.filter((item) => item.roles.includes(role));
  
  const [openAIKey, setOpenAIKey] = useState<string | undefined>(
    localStorage.getItem('openai_api_key') ||
    import.meta.env.VITE_OPENAI_API_KEY ||
    undefined
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  const SidebarContent = () => (
    <>
      {/* Sidebar Header */}
      <div className="flex items-center justify-center h-16 px-6 border-b border-border">
        <FlowcodeLogo />
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 mt-6 px-3 overflow-y-auto">
        <div className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  "min-h-[44px] touch-target",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={closeSidebar}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer - Theme toggle and User menu */}
      <div className="border-t border-border p-4 space-y-4">
        {/* Theme toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tema</span>
          <div className="flex items-center space-x-2">
            <Sun className="h-4 w-4" />
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
            <Moon className="h-4 w-4" />
          </div>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2">
              <User className="h-5 w-5 mr-3" />
              <span className="truncate">{user?.email || 'Usuário'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-1 bg-card shadow-lg border-r">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar (opened from "Mais" bottom nav item) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 safe-area-left">
          <div className="flex flex-col h-full bg-card">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        "lg:ml-64"
      )}>
        <main className="flex-1 px-4 pt-4 pb-24 sm:px-5 sm:pb-5 lg:pt-6 lg:px-6 lg:pb-6 space-section">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const isActive = item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full",
                  "transition-colors touch-target",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span className={cn(
                  "text-[10px] leading-tight",
                  isActive ? "font-semibold" : "font-medium"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          {/* "Mais" button opens full sidebar */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 h-full",
              "transition-colors touch-target",
              "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] leading-tight font-medium">Mais</span>
          </button>
        </div>
      </nav>

      {/* AI Chat Widget */}
      <SimpleChatWidget />
    </div>
  );
}
