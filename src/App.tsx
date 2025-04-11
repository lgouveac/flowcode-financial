
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
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

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark">
        <Toaster />
        <Routes>
          <Route path="/register-client" element={<PublicClientForm />} />
          <Route path="/register-employee" element={<PublicEmployeeForm />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="*" element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
            <Route path="" element={<Overview />} />
            <Route path="employees" element={<Employees />} />
            <Route path="emails" element={<Emails />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
