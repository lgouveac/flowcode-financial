
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import { Overview } from "./pages/Overview";
import { ClientTable } from "@/components/ClientTable";
import { EmployeeTable } from "@/components/EmployeeTable";
import { RecurringBilling } from "@/components/RecurringBilling";
import { CashFlow } from "@/components/CashFlow";
import Emails from "./pages/Emails";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import EmailConfirmed from "./pages/auth/EmailConfirmed";
import PublicClientForm from "./pages/PublicClientForm";
import ThankYou from "./pages/ThankYou";
import EmployeesPage from "./pages/Employees";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes - positioned before the auth routes */}
              <Route path="/register-client" element={<PublicClientForm />} />
              <Route path="/thank-you" element={<ThankYou />} />
              
              {/* Rotas de autenticação */}
              <Route path="/auth">
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="verify-email" element={<VerifyEmail />} />
                <Route path="email-confirmed" element={<EmailConfirmed />} />
              </Route>

              {/* Rotas protegidas */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>}>
                <Route index element={<Overview />} />
                <Route path="clients" element={<ClientTable />} />
                <Route path="employees" element={<EmployeeTable />} />
                <Route path="receivables" element={<RecurringBilling />} />
                <Route path="emails" element={<Emails />} />
                <Route path="cashflow" element={<CashFlow showChart={true} />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
