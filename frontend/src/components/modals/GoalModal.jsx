import { useState } from "react";
import Modal from "@/components/Modal";
import { GOAL_EMOJIS, todayISO } from "@/lib/format";

export default function GoalModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [deadline, setDeadline] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !target || Number(target) <= 0) return;
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), emoji, target: Number(target), saved: Number(saved || 0), deadline });
      setName(""); setTarget(""); setSaved(""); setEmoji("🎯");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova meta" testid="goal-modal">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <span className="mb-2 block text-xs uppercase tracking-widest text-brand-dim">Escolha um ícone</span>
          <div className="flex flex-wrap gap-2">
            {GOAL_EMOJIS.map((em) => (
              <button
                type="button"
                key={em}
                data-testid={`goal-emoji-${em}`}
                onClick={() => setEmoji(em)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border text-xl transition-all ${
                  emoji === em
                    ? "border-[#D4FF00] bg-[#D4FF00]/10 scale-110"
                    : "border-brand-border bg-brand-bg hover:border-brand-borderHover"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
        <Field label="Nome da meta">
          <input
            data-testid="goal-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex: Viagem à Bahia"
            className={fieldCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor objetivo (R$)">
            <input
              data-testid="goal-target-input"
              type="number" step="0.01" min="0.01" required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0,00"
              className={fieldCls}
            />
          </Field>
          <Field label="Já guardei (R$)">
            <input
              data-testid="goal-saved-input"
              type="number" step="0.01" min="0"
              value={saved}
              onChange={(e) => setSaved(e.target.value)}
              placeholder="0,00"
              className={fieldCls}
            />
          </Field>
        </div>
        <Field label="Prazo">
          <input
            data-testid="goal-deadline-input"
            type="date" required value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={fieldCls}
          />
        </Field>
        <button
          type="submit"
          data-testid="goal-submit-btn"
          disabled={loading}
          className="mt-2 w-full rounded-full bg-[#D4FF00] px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-[#B3D600] disabled:opacity-60"
        >
          {loading ? "Criando..." : "Criar meta"}
        </button>
      </form>
    </Modal>
  );
}

const fieldCls =
  "w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-brand-dim focus:border-[#D4FF00] focus:ring-1 focus:ring-[#D4FF00]";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-widest text-brand-dim">{label}</span>
      {children}
    </label>
  );
}
