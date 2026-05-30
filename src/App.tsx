import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

// Pages
import LoginPage from "./pages/LoginPage";
import OperatorDashboard from "./pages/operator/OperatorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NewClientPage from "./pages/clients/NewClientPage";
import ClientDetailPage from "./pages/clients/ClientDetailPage";
import ClientsListPage from "./pages/clients/ClientsListPage";
import NewBudgetPage from "./pages/budgets/NewBudgetPage";
import BudgetsListPage from "./pages/budgets/BudgetsListPage";
import BudgetDetailPage from "./pages/budgets/BudgetDetailPage";
import PartsManagementPage from "./pages/admin/PartsManagementPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Sempre espera o loading terminar antes de tomar qualquer decisão
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Só redireciona para login após o loading terminar E não estar autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Verifica roles apenas se o usuário existe
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/operador'} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated 
          ? <Navigate to={user?.role === 'admin' ? '/admin' : '/operador'} replace />
          : <LoginPage />
      } />
      
      {/* Root redirect */}
      <Route path="/" element={
        isAuthenticated 
          ? <Navigate to={user?.role === 'admin' ? '/admin' : '/operador'} replace />
          : <Navigate to="/login" replace />
      } />
      
      {/* Operator Routes */}
      <Route path="/operador" element={<ProtectedRoute><OperatorDashboard /></ProtectedRoute>} />
      <Route path="/operador/clientes" element={<ProtectedRoute><ClientsListPage /></ProtectedRoute>} />
      <Route path="/operador/clientes/novo" element={<ProtectedRoute><NewClientPage /></ProtectedRoute>} />
      <Route path="/operador/clientes/:id" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
      <Route path="/operador/orcamentos" element={<ProtectedRoute><BudgetsListPage /></ProtectedRoute>} />
      <Route path="/operador/orcamento/novo/:clientId" element={<ProtectedRoute><NewBudgetPage /></ProtectedRoute>} />
      <Route path="/operador/orcamento/:id" element={<ProtectedRoute><BudgetDetailPage /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/clientes" element={<ProtectedRoute allowedRoles={['admin']}><ClientsListPage /></ProtectedRoute>} />
      <Route path="/admin/clientes/novo" element={<ProtectedRoute allowedRoles={['admin']}><NewClientPage /></ProtectedRoute>} />
      <Route path="/admin/clientes/:id" element={<ProtectedRoute allowedRoles={['admin']}><ClientDetailPage /></ProtectedRoute>} />
      <Route path="/admin/orcamentos" element={<ProtectedRoute allowedRoles={['admin']}><BudgetsListPage /></ProtectedRoute>} />
      <Route path="/admin/orcamento/novo/:clientId" element={<ProtectedRoute allowedRoles={['admin']}><NewBudgetPage /></ProtectedRoute>} />
      <Route path="/admin/orcamento/:id" element={<ProtectedRoute allowedRoles={['admin']}><BudgetDetailPage /></ProtectedRoute>} />
      <Route path="/admin/pecas" element={<ProtectedRoute allowedRoles={['admin']}><PartsManagementPage /></ProtectedRoute>} />
      <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
