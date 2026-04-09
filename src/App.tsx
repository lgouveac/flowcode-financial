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
import ContractVisualViewer from "./pages/ContractVisualViewer";
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
import TasksKanban from "./pages/TasksKanban";
import PublicTaskSubmit from "./pages/PublicTaskSubmit";
import { RoleGate } from "./components/auth/RoleGate";
import EnhancedDashboardPreview from "./components/enhanced-dashboard-preview";
import AccessVault from "./pages/AccessVault";
import ClientDetailPage from "./pages/ClientDetailPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";

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
                    <Route path="/contract-visual/:contractId" element={<ContractVisualViewer />} />
                    <Route path="/project-view/:projectId" element={<PublicProjectView />} />
                    <Route path="/public-projects" element={<PublicProjects />} />
                    <Route path="/submit-task/:token" element={<PublicTaskSubmit />} />
                    <Route path="/test-sync" element={<TestSync />} />
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/register" element={<Register />} />
                    <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/verify-email" element={<VerifyEmail />} />
                    <Route path="/auth/email-confirmed" element={<EmailConfirmed />} />
                    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>}>
                      <Route index element={<Overview />} />
                      {/* Admin-only routes */}
                      <Route path="employees" element={<RoleGate allowedRoles={['admin']}><EmployeesPage /></RoleGate>} />
                      <Route path="emails" element={<RoleGate allowedRoles={['admin']}><Emails /></RoleGate>} />
                      <Route path="users" element={<RoleGate allowedRoles={['admin']}><Users /></RoleGate>} />
                      {/* AccessVault is now accessed through project detail page "Acessos" tab */}
                      <Route path="dashboard-preview" element={<RoleGate allowedRoles={['admin']}><EnhancedDashboardPreview /></RoleGate>} />
                      {/* Admin + Financial routes */}
                      <Route path="clients" element={<RoleGate allowedRoles={['admin', 'financial']}><ClientTable /></RoleGate>} />
                      <Route path="clients/:clientId" element={<RoleGate allowedRoles={['admin', 'financial']}><ClientDetailPage /></RoleGate>} />
                      <Route path="receivables" element={<RoleGate allowedRoles={['admin', 'financial']}><RecurringBilling /></RoleGate>} />
                      <Route path="contracts" element={<RoleGate allowedRoles={['admin', 'financial']}><Contracts /></RoleGate>} />
                      <Route path="payments" element={<RoleGate allowedRoles={['admin', 'financial']}><PaymentsByClient /></RoleGate>} />
                      <Route path="cashflow" element={<RoleGate allowedRoles={['admin', 'financial']}><CashFlow showChart={true} /></RoleGate>} />
                      <Route path="estimated-expenses" element={<RoleGate allowedRoles={['admin', 'financial']}><EstimatedExpenses /></RoleGate>} />
                      <Route path="leads" element={<RoleGate allowedRoles={['admin', 'financial']}><Leads /></RoleGate>} />
                      {/* Admin + Employee routes */}
                      <Route path="projects" element={<Projects />} />
                      <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                      <Route path="projects/:projectId/:tab" element={<ProjectDetailPage />} />
                      {/* Tasks kanban is now accessed through project detail page "Tarefas" tab */}
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