import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, tokenStore } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setUser(false); setChecked(true); return; }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      tokenStore.clear();
      setUser(false);
    } finally { setChecked(true); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAuthResponse = (data) => {
    if (data?.access_token) tokenStore.set(data.access_token);
    setUser(data);
    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    return handleAuthResponse(data);
  };
  const register = async (email, password) => {
    const { data } = await api.post("/auth/register", { email, password });
    return handleAuthResponse(data);
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    tokenStore.clear();
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, checked, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
