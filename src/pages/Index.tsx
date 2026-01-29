
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
  Menu,
  X,
  User,
  Moon,
  Sun,
  Calculator,
  Shield,
  Target,
  FolderOpen,
  ClipboardList
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { FlowcodeLogo } from "@/components/ui/logo";
import { useAuth } from "@/components/auth/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SimpleChatWidget } from "@/components/ai-chat/SimpleChatWidget";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Funcionários", href: "/employees", icon: UserCheck },
  { name: "Recebimentos", href: "/receivables", icon: Receipt },
  { name: "Contratos", href: "/contracts", icon: FileText },
  { name: "Projetos", href: "/projects", icon: FolderOpen },
  { name: "Atas de Reunião", href: "/meeting-minutes", icon: ClipboardList },
  { name: "Pagamentos", href: "/payments", icon: DollarSign },
  { name: "Fluxo de Caixa", href: "/cashflow", icon: TrendingUp },
  { name: "Despesas Estimadas", href: "/estimated-expenses", icon: Calculator },
  { name: "Leads", href: "/leads", icon: Target },
  { name: "Usuários", href: "/users", icon: Shield },
];

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Configuração da API Key do OpenRouter
  const [openAIKey, setOpenAIKey] = useState<string | undefined>(
    // Primeiro tenta localStorage, depois variável de ambiente, senão usa a sua chave
    localStorage.getItem('openai_api_key') || 
    import.meta.env.VITE_OPENROUTER_API_KEY || 
    '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'
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
          {navigation.map((item) => {
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

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 
              bg-background/80 backdrop-blur-sm
              shadow-lg border touch-target
              safe-area-top safe-area-left"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 safe-area-left">
          <div className="flex flex-col h-full bg-card">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        "lg:ml-64" // Add left margin on desktop to account for fixed sidebar
      )}>
        <main className="flex-1 p-4 sm:p-5 lg:p-6 space-section">
          <Outlet />
        </main>
      </div>

      {/* AI Chat Widget */}
      <SimpleChatWidget />
    </div>
  );
}
