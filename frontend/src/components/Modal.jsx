import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, testid }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div data-testid={testid} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-2xl fade-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif-display text-2xl tracking-tight">{title}</h3>
          <button
            data-testid="modal-close-btn"
            onClick={onClose}
            className="rounded-full p-2 text-brand-muted transition-colors hover:bg-brand-surfaceHover hover:text-brand-text"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
