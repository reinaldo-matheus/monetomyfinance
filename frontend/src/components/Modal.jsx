import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, testid }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div data-testid={testid} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg border border-hud-cyan/60 bg-hud-surface p-6 shadow-glow-cyan fade-in">
        <span className="hud-bracket tl" /><span className="hud-bracket tr" /><span className="hud-bracket bl" /><span className="hud-bracket br" />
        <div className="mb-5 flex items-center justify-between border-b border-hud-border pb-4">
          <div>
            <span className="label-hud">// modal.window</span>
            <h3 className="font-display mt-1 text-2xl font-bold uppercase tracking-tight text-hud-cyan glow-cyan-text">{title}</h3>
          </div>
          <button
            data-testid="modal-close-btn"
            onClick={onClose}
            className="border border-hud-border p-2 text-hud-muted transition-colors hover:border-hud-pink hover:text-hud-pink"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
