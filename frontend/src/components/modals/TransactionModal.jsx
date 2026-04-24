import { useState } from "react";
import Modal from "@/components/Modal";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, todayISO } from "@/lib/format";

export default function TransactionModal({ open, onClose, onSubmit }) {
  const [type, setType] = useState("despesa");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  const cats = type === "receita" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const switchType = (t) => {
    setType(t);
    setCategory(t === "receita" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !value || Number(value) <= 0) return;
    setLoading(true);
    try {
      await onSubmit({ type, description: description.trim(), value: Number(value), category, date });
      setDescription(""); setValue(""); setDate(todayISO());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova transação" testid="transaction-modal">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex rounded-full border border-brand-border bg-brand-bg p-1">
          {["receita", "despesa"].map((t) => (
            <button
              key={t}
              type="button"
              data-testid={`tx-type-${t}-btn`}
              onClick={() => switchType(t)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium capitalize transition-all ${
                type === t
                  ? t === "receita" ? "bg-[#D4FF00] text-black" : "bg-[#FF443A] text-white"
                  : "text-brand-muted hover:text-brand-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Field label="Descrição">
          <input
            data-testid="tx-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Ex: Supermercado"
            className={fieldCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)">
            <input
              data-testid="tx-value-input"
              type="number" step="0.01" min="0.01" required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              className={fieldCls}
            />
          </Field>
          <Field label="Data">
            <input
              data-testid="tx-date-input"
              type="date" required value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldCls}
            />
          </Field>
        </div>
        <Field label="Categoria">
          <select
            data-testid="tx-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldCls}
          >
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <button
          type="submit"
          data-testid="tx-submit-btn"
          disabled={loading}
          className="mt-2 w-full rounded-full bg-[#D4FF00] px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-[#B3D600] disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Adicionar transação"}
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
