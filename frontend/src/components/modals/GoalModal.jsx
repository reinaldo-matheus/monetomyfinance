import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { GOAL_EMOJIS, todayISO } from "@/lib/format";

export default function GoalModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [deadline, setDeadline] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(""); setEmoji("🎯"); setTarget(""); setSaved(""); setDeadline(todayISO());
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !target || Number(target) <= 0) return;
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), emoji, target: Number(target), saved: Number(saved || 0), deadline });
      setName(""); setTarget(""); setSaved(""); setEmoji("🎯");
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova quest" testid="goal-modal">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <span className="label-hud mb-2 block">Ícone da Quest</span>
          <div className="flex flex-wrap gap-2">
            {GOAL_EMOJIS.map((em) => (
              <button
                type="button" key={em} data-testid={`goal-emoji-${em}`}
                onClick={() => setEmoji(em)}
                className={`flex h-11 w-11 items-center justify-center border text-xl transition-all ${
                  emoji === em
                    ? "border-hud-cyan bg-hud-cyan/10 shadow-glow-cyan scale-110"
                    : "border-hud-border bg-hud-bg hover:border-hud-muted"
                }`}
              >{em}</button>
            ))}
          </div>
        </div>
        <Field label="Nome da Quest">
          <input
            data-testid="goal-name-input" value={name}
            onChange={(e) => setName(e.target.value)} required
            placeholder="Ex: Viagem à Bahia" className={fieldCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Objetivo (CR)">
            <input data-testid="goal-target-input" type="number" step="0.01" min="0.01" required
              value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0,00" className={fieldCls} />
          </Field>
          <Field label="XP inicial (CR)">
            <input data-testid="goal-saved-input" type="number" step="0.01" min="0"
              value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0,00" className={fieldCls} />
          </Field>
        </div>
        <Field label="Prazo / Deadline">
          <input data-testid="goal-deadline-input" type="date" required value={deadline}
            onChange={(e) => setDeadline(e.target.value)} className={fieldCls} />
        </Field>
        <button
          type="submit" data-testid="goal-submit-btn" disabled={loading}
          className="btn-hud mt-2 flex w-full items-center justify-center gap-2 border border-hud-purple bg-hud-purple/10 px-6 py-3 text-xs text-hud-purple transition-all hover:bg-hud-purple hover:text-white hover:shadow-glow-purple disabled:opacity-50"
        >
          {loading ? "COMPILANDO..." : "INICIAR QUEST"}
        </button>
      </form>
    </Modal>
  );
}

const fieldCls =
  "w-full border border-hud-border bg-hud-bg px-3 py-2.5 font-mono-hud text-sm text-hud-text outline-none transition-all placeholder:text-hud-dim focus:border-hud-cyan focus:shadow-glow-cyan";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label-hud mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
