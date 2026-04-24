import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, kind = "success") => {
    setToast({ message, kind, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          data-testid="toast"
          className="toast-anim fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-full border px-5 py-3 text-sm backdrop-blur-md"
          style={{
            background: toast.kind === "error" ? "rgba(255,68,58,0.12)" : "rgba(212,255,0,0.10)",
            borderColor: toast.kind === "error" ? "rgba(255,68,58,0.35)" : "rgba(212,255,0,0.35)",
            color: toast.kind === "error" ? "#FF8A82" : "#D4FF00",
          }}
        >
          {toast.message}
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
