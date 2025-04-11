import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import EmailConfirmed from "./pages/EmailConfirmed";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Overview from "./pages/Overview";
import Clients from "./pages/Clients";
import Employees from "./pages/Employees";
import CashFlow from "./pages/CashFlow";
import RecurringBilling from "./pages/RecurringBilling";
import Emails from "./pages/Emails";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicClientForm from "./pages/PublicClientForm";
import ThankYou from "./pages/ThankYou";
import PublicEmployeeForm from "./pages/PublicEmployeeForm";
import RegisterEmployee from "./pages/RegisterEmployee";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/email-confirmed" element={<EmailConfirmed />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register-client" element={<PublicClientForm />} />
          <Route path="/register-employee" element={<PublicEmployeeForm />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="*" element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
            <Route path="" element={<Overview />} />
            <Route path="clients" element={<Clients />} />
            <Route path="employees" element={<Employees />} />
            <Route path="cash-flow" element={<CashFlow />} />
            <Route path="recurring-billing" element={<RecurringBilling />} />
            <Route path="emails" element={<Emails />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
