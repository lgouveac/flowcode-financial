import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TimerProvider } from "@/components/projects/TimerContext";
import { GlobalTimerModal } from "@/components/projects/GlobalTimerModal";
import Index from "./pages/Index";
import { Overview } from "./pages/Overview";
import { ClientTable } from "@/components/ClientTable";
import { EmployeeTable } from "@/components/EmployeeTable";
import { RecurringBilling } from "@/components/RecurringBilling";
import { CashFlow } from "@/components/CashFlow";
import Emails from "./pages/Emails";
import Contracts from "./pages/Contracts";
import ContractSigning from "./pages/ContractSigning";
import PaymentsByClient from "./pages/PaymentsByClient";
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
import Users from "./pages/Users";
import Leads from "./pages/Leads";
import Projects from "./pages/Projects";
import PublicProjectView from "./pages/PublicProjectView";
import PublicProjects from "./pages/PublicProjects";
import TestSync from "./pages/TestSync";
import MeetingMinutes from "./pages/MeetingMinutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      gcTime: 1000 * 60 * 10,
    },
  },
});

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <TimerProvider>
                  <Routes>
                    <Route path="/register-client" element={<PublicClientForm />} />
                    <Route path="/register-employee" element={<PublicEmployeeForm />} />
                    <Route path="/thank-you" element={<ThankYou />} />
                    <Route path="/contract-signing/:contractId" element={<ContractSigning />} />
                    <Route path="/project-view/:projectId" element={<PublicProjectView />} />
                    <Route path="/public-projects" element={<PublicProjects />} />
                    <Route path="/test-sync" element={<TestSync />} />
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/register" element={<Register />} />
                    <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/verify-email" element={<VerifyEmail />} />
                    <Route path="/auth/email-confirmed" element={<EmailConfirmed />} />
                    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>}>
                      <Route index element={<Overview />} />
                      <Route path="clients" element={<ClientTable />} />
                      <Route path="employees" element={<EmployeesPage />} />
                      <Route path="receivables" element={<RecurringBilling />} />
                      <Route path="contracts" element={<Contracts />} />
                      <Route path="emails" element={<Emails />} />
                      <Route path="payments" element={<PaymentsByClient />} />
                      <Route path="cashflow" element={<CashFlow showChart={true} />} />
                      <Route path="estimated-expenses" element={<EstimatedExpenses />} />
                      <Route path="leads" element={<Leads />} />
                      <Route path="users" element={<Users />} />
                      <Route path="projects" element={<Projects />} />
                      <Route path="meeting-minutes" element={<MeetingMinutes />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/auth/login" replace />} />
                  </Routes>
                  <GlobalTimerModal />
                </TimerProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;