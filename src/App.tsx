
import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Contracts from "./pages/Contracts";
import EstimatedExpenses from "./pages/EstimatedExpenses";
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
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public routes that don't need auth checks */}
                <Route path="/register-client" element={<PublicClientForm />} />
                <Route path="/register-employee" element={<PublicEmployeeForm />} />
                <Route path="/thank-you" element={<ThankYou />} />
                
                {/* Auth pages - wrapped in AuthProvider but not in ProtectedRoute */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/auth/verify-email" element={<VerifyEmail />} />
                <Route path="/auth/email-confirmed" element={<EmailConfirmed />} />
                
                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>}>
                  <Route index element={<Overview />} />
                  <Route path="clients" element={<ClientTable />} />
                  <Route path="employees" element={<EmployeesPage />} />
                  <Route path="receivables" element={<RecurringBilling />} />
                  <Route path="contracts" element={<Contracts />} />
                  <Route path="emails" element={<Emails />} />
                  <Route path="cashflow" element={<CashFlow showChart={true} />} />
                  <Route path="estimated-expenses" element={<EstimatedExpenses />} />
                </Route>
                
                {/* Catch all other routes */}
                <Route path="*" element={<Navigate to="/auth/login" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
