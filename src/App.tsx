
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
import PublicEmployeeForm from "./pages/PublicEmployeeForm";
import ThankYou from "./pages/ThankYou";
import EmployeesPage from "./pages/Employees";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Shorten stale time to refresh data more frequently
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Retry failed queries to handle network issues
      retry: 1,
      // Set cache time to prevent immediate garbage collection
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* Public routes must be outside of AuthProvider to avoid any auth checks */}
          <Routes>
            <Route path="/register-client" element={<PublicClientForm />} />
            <Route path="/register-employee" element={<PublicEmployeeForm />} />
            <Route path="/thank-you" element={<ThankYou />} />
            
            {/* All authenticated routes wrapped in AuthProvider */}
            <Route path="*" element={
              <AuthProvider>
                <Routes>
                  {/* Auth routes */}
                  <Route path="/auth">
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password" element={<ResetPassword />} />
                    <Route path="verify-email" element={<VerifyEmail />} />
                    <Route path="email-confirmed" element={<EmailConfirmed />} />
                  </Route>

                  {/* Protected routes */}
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
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
