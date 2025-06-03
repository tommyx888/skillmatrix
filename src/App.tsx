import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Main pages
import Index from "./pages/Index";
import SkillMatrix from "./pages/SkillMatrix";
import Training from "./pages/Training";
import GapAnalysis from "./pages/GapAnalysis";
import Teams from "./pages/Teams";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import MatrixGenerator from "./pages/MatrixGenerator";
import Employees from "./pages/Employees";
import EmployeeMatrix from "./pages/EmployeeMatrix";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
import UserManagement from "./pages/UserManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Routes - Any authenticated user */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/skill-matrix" element={<ProtectedRoute><SkillMatrix /></ProtectedRoute>} />
            <Route path="/employee-matrix" element={<ProtectedRoute><EmployeeMatrix /></ProtectedRoute>} />
            
            {/* Admin & Manager Only Routes */}
            <Route path="/matrix-generator" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><MatrixGenerator /></ProtectedRoute>} />
            <Route path="/training" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Training /></ProtectedRoute>} />
            <Route path="/gap-analysis" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><GapAnalysis /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Teams /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Employees /></ProtectedRoute>} />
            
            {/* Admin Only Routes */}
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;