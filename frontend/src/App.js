import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import "@/App.css";

function Gate({ children, requireAuth }) {
  const { user, checked } = useAuth();
  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hud-bg">
        <div className="font-mono-hud text-xs uppercase tracking-[0.3em] text-hud-cyan glow-cyan-text animate-pulse">&gt; carregando sistema...</div>
      </div>
    );
  }
  if (requireAuth && !user) return <Navigate to="/auth" replace />;
  if (!requireAuth && user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Gate requireAuth={false}><Auth /></Gate>} />
            <Route path="/" element={<Gate requireAuth={true}><Dashboard /></Gate>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
