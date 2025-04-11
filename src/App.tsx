
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { Overview } from "./pages/Overview";
import RegisterEmployee from "./pages/RegisterEmployee";
import PublicEmployeeForm from "./pages/PublicEmployeeForm";
import PublicClientForm from "./pages/PublicClientForm";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import Emails from "./pages/Emails";
import Employees from "./pages/Employees";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./components/auth/AuthContext";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import EmailConfirmed from "./pages/auth/EmailConfirmed";
import Index from "./pages/Index";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <Toaster />
          <Routes>
            {/* Public routes - No authentication required */}
            {/* These routes are placed OUTSIDE of any authentication checks */}
            <Route path="/register-client" element={<PublicClientForm />} />
            <Route path="/register-employee" element={<PublicEmployeeForm />} />
            <Route path="/thank-you" element={<ThankYou />} />
            
            {/* Auth routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/email-confirmed" element={<EmailConfirmed />} />
            
            {/* Protected routes - Authentication required */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>}>
              <Route index element={<Overview />} />
              <Route path="employees" element={<Employees />} />
              <Route path="emails" element={<Emails />} />
            </Route>
            
            {/* Catch-all route for authenticated users */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
