import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { BRL } from "@/lib/format";

export default function DepositModal({ open, onClose, goal, onSubmit }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) setAmount(""); }, [open]);

  if (!goal) return null;
  const missing = Math.max(0, Number(goal.target) - Number(goal.saved));

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    try { await onSubmit(goal, Number(amount)); onClose(); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`XP+ em ${goal.emoji} ${goal.name}`} testid="deposit-modal">
      <form onSubmit={submit} className="space-y-4">
        <div className="border border-hud-border bg-hud-bg p-4">
          <span className="label-hud">XP RESTANTE</span>
          <div className="font-display text-3xl font-bold text-hud-pink glow-pink-text">{BRL(missing)}</div>
        </div>
        <label className="block">
          <span className="label-hud mb-1.5 block">Valor do aporte</span>
          <input
            data-testid="deposit-amount-input"
            type="number" step="0.01" min="0.01" required
            value={amount} onChange={(e) => setAmount(e.target.value)}
            autoFocus placeholder="0,00"
            className="w-full border border-hud-border bg-hud-bg px-3 py-2.5 font-mono-hud text-sm outline-none transition-all focus:border-hud-cyan focus:shadow-glow-cyan"
          />
        </label>
        <button
          type="submit" data-testid="deposit-submit-btn" disabled={loading}
          className="btn-hud flex w-full items-center justify-center gap-2 border border-hud-green bg-hud-green/10 px-6 py-3 text-xs text-hud-green transition-all hover:bg-hud-green hover:text-black hover:shadow-glow-green disabled:opacity-50"
        >
          {loading ? "PROCESSANDO..." : "CONFIRMAR XP"}
        </button>
      </form>
    </Modal>
  );
}
