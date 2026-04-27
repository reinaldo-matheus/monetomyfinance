import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { EXPENSE_CATEGORIES, GOAL_EMOJIS } from "@/lib/format";

export default function BillModal({ open, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState("💰");
    const [value, setValue] = useState("");
    const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
    const [dueDay, setDueDay] = useState("1");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setName(""); setEmoji("💰"); setValue("");
            setCategory(EXPENSE_CATEGORIES[0]); setDueDay("1");
        }
    }, [open]);

    const submit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !value || Number(value) <= 0) return;
        setLoading(true);
        try {
            await onSubmit({
                name: name.trim(), emoji, value: Number(value),
                category, due_day: Number(dueDay)
            });
            onClose();
        } finally { setLoading(false); }
    };

    const BILL_EMOJIS = ["💰", "🏠", "💡", "📱", "🎓", "🚗", "💊", "📺", "🌊", "🔥"];

    return (
        <Modal open={open} onClose={onClose} title="Nova Conta Fixa" testid="bill-modal">
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <span className="label-hud mb-2 block">Ícone</span>
                    <div className="flex flex-wrap gap-2">
                        {BILL_EMOJIS.map((em) => (
                            <button type="button" key={em}
                                onClick={() => setEmoji(em)}
                                className={`flex h-10 w-10 items-center justify-center border text-xl transition-all ${emoji === em
                                        ? "border-hud-cyan bg-hud-cyan/10 shadow-glow-cyan scale-110"
                                        : "border-hud-border bg-hud-bg hover:border-hud-muted"
                                    }`}
                            >{em}</button>
                        ))}
                    </div>
                </div>
                <Field label="Nome da Conta">
                    <input value={name} onChange={(e) => setName(e.target.value)}
                        required placeholder="Ex: Aluguel" className={fieldCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Valor (CR)">
                        <input type="number" step="0.01" min="0.01" required
                            value={value} onChange={(e) => setValue(e.target.value)}
                            placeholder="0,00" className={fieldCls} />
                    </Field>
                    <Field label="Dia do vencimento">
                        <input type="number" min="1" max="31" required
                            value={dueDay} onChange={(e) => setDueDay(e.target.value)}
                            className={fieldCls} />
                    </Field>
                </div>
                <Field label="Categoria">
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                        className={fieldCls}>
                        {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </Field>
                <button type="submit" disabled={loading}
                    className="btn-hud mt-2 flex w-full items-center justify-center gap-2 border border-hud-cyan bg-hud-cyan/10 px-6 py-3 text-xs text-hud-cyan transition-all hover:bg-hud-cyan hover:text-black hover:shadow-glow-cyan disabled:opacity-50">
                    {loading ? "SALVANDO..." : "ADICIONAR CONTA"}
                </button>
            </form>
        </Modal>
    );
}

const fieldCls = "w-full border border-hud-border bg-hud-bg px-3 py-2.5 font-mono-hud text-sm text-hud-text outline-none transition-all placeholder:text-hud-dim focus:border-hud-cyan focus:shadow-glow-cyan";

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="label-hud mb-1.5 block">{label}</span>
            {children}
        </label>
    );
}