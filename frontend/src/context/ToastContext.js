import { createContext, useCallback, useContext, useState } from "react";
import { Zap, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, kind = "success") => {
    setToast({ message, kind, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const isError = toast?.kind === "error";
  const prefix = isError ? "SYSTEM FAILURE" : "ACHIEVEMENT UNLOCKED";
  const color = isError ? "#FF0055" : "#39FF14";
  const glow = isError ? "rgba(255,0,85,0.5)" : "rgba(57,255,20,0.5)";

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          data-testid="toast"
          className="toast-anim fixed bottom-8 left-1/2 z-[100] -translate-x-1/2"
        >
          <div
            className="flex items-center gap-3 border bg-hud-surface px-5 py-3 font-mono-hud text-[11px] uppercase tracking-[0.2em]"
            style={{ borderColor: color, boxShadow: `0 0 20px ${glow}, inset 0 0 0 1px ${color}55`, color }}
          >
            {isError ? <AlertTriangle size={14} /> : <Zap size={14} />}
            <span className="font-bold">{prefix}</span>
            <span className="text-hud-text">// {toast.message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { show: () => {} };
  return ctx;
}
