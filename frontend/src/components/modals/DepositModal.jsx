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
    try {
      await onSubmit(goal, Number(amount));
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Depositar em ${goal.emoji} ${goal.name}`} testid="deposit-modal">
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
          <div className="text-xs uppercase tracking-widest text-brand-dim">Falta</div>
          <div className="font-serif-display text-3xl">{BRL(missing)}</div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-brand-dim">Valor a depositar</span>
          <input
            data-testid="deposit-amount-input"
            type="number" step="0.01" min="0.01" required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            placeholder="0,00"
            className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#D4FF00] focus:ring-1 focus:ring-[#D4FF00]"
          />
        </label>
        <button
          type="submit"
          data-testid="deposit-submit-btn"
          disabled={loading}
          className="w-full rounded-full bg-[#D4FF00] px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-[#B3D600] disabled:opacity-60"
        >
          {loading ? "Depositando..." : "Confirmar depósito"}
        </button>
      </form>
    </Modal>
  );
}
