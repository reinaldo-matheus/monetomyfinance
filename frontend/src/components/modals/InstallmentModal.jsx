import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { EXPENSE_CATEGORIES } from "@/lib/format";

export default function InstallmentModal({ open, onClose, onSubmit, editingInstallment }) {
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState("💳");
    const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
    const [dueDay, setDueDay] = useState("1");
    const [mode, setMode] = useState("parcela"); // "parcela" ou "total"
    const [installmentValue, setInstallmentValue] = useState("");
    const [totalValue, setTotalValue] = useState("");
    const [totalInstallments, setTotalInstallments] = useState("");
    const [loading, setLoading] = useState(false);

    const isEditing = !!editingInstallment;

    useEffect(() => {
        if (open) {
            if (editingInstallment) {
                setName(editingInstallment.name);
                setEmoji(editingInstallment.emoji);
                setCategory(editingInstallment.category);
                setDueDay(String(editingInstallment.due_day));
                setInstallmentValue(String(editingInstallment.installment_value));
                setTotalInstallments(String(editingInstallment.total_installments));
                setMode("parcela");
            } else {
                setName(""); setEmoji("💳"); setCategory(EXPENSE_CATEGORIES[0]);
                setDueDay("1"); setInstallmentValue(""); setTotalValue("");
                setTotalInstallments(""); setMode("parcela");
            }
        }
    }, [open, editingInstallment]);

    // Calcula valores derivados
    const computedInstallmentValue = mode === "total" && totalValue && totalInstallments
        ? (Number(totalValue) / Number(totalInstallments)).toFixed(2)
        : installmentValue;

    const computedTotal = mode === "parcela" && installmentValue && totalInstallments
        ? (Number(installmentValue) * Number(totalInstallments)).toFixed(2)
        : totalValue;

    const submit = async (e) => {
        e.preventDefault();
        const instVal = Number(computedInstallmentValue);
        const nInst = Number(totalInstallments);
        if (!name.trim() || instVal <= 0 || nInst < 2) return;
        setLoading(true);
        try {
            await onSubmit({
                name: name.trim(), emoji, category,
                due_day: Number(dueDay),
                installment_value: instVal,
                total_installments: nInst,
            });
            onClose();
        } finally { setLoading(false); }
    };

    const EMOJIS = [
        "💳", "🚗", "🏠", "📱", "🎓", "💊", "🛒", "✈️", "🏦", "🔧",
        "🎮", "📺", "🌐", "👕", "🍔", "🏋️", "💈", "🐾", "📦", "🔥"
    ];

    return (
        <Modal open={open} onClose={onClose}
            title={isEditing ? "Editar Parcelamento" : "Novo Parcelamento"}
            testid="installment-modal">
            <form onSubmit={submit} className="space-y-4">
                {/* Emoji */}
                <div>
                    <span className="label-hud mb-2 block">Ícone</span>
                    <div className="flex flex-wrap gap-2">
                        {EMOJIS.map((em) => (
                            <button type="button" key={em} onClick={() => setEmoji(em)}
                                className={`flex h-10 w-10 items-center justify-center border text-xl transition-all ${emoji === em
                                        ? "border-hud-cyan bg-hud-cyan/10 shadow-glow-cyan scale-110"
                                        : "border-hud-border bg-hud-bg hover:border-hud-muted"
                                    }`}>{em}</button>
                        ))}
                    </div>
                </div>

                {/* Nome */}
                <Field label="Nome">
                    <input value={name} onChange={(e) => setName(e.target.value)}
                        required placeholder="Ex: Financiamento Carro" className={fieldCls} />
                </Field>

                {/* Modo de cálculo */}
                <div>
                    <span className="label-hud mb-2 block">Modo de cálculo</span>
                    <div className="flex border border-hud-border bg-hud-bg p-1 gap-1">
                        {[
                            { id: "parcela", label: "Valor da parcela" },
                            { id: "total", label: "Valor total" },
                        ].map((m) => (
                            <button type="button" key={m.id} onClick={() => setMode(m.id)}
                                className={`btn-hud flex-1 px-3 py-2 text-[10px] transition-all ${mode === m.id
                                        ? "bg-hud-cyan text-black shadow-glow-cyan"
                                        : "text-hud-muted hover:text-hud-cyan"
                                    }`}>{m.label.toUpperCase()}</button>
                        ))}
                    </div>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-2 gap-3">
                    {mode === "parcela" ? (
                        <Field label="Valor da parcela (CR)">
                            <input type="number" step="0.01" min="0.01" required
                                value={installmentValue} onChange={(e) => setInstallmentValue(e.target.value)}
                                placeholder="0,00" className={fieldCls} />
                        </Field>
                    ) : (
                        <Field label="Valor total (CR)">
                            <input type="number" step="0.01" min="0.01" required
                                value={totalValue} onChange={(e) => setTotalValue(e.target.value)}
                                placeholder="0,00" className={fieldCls} />
                        </Field>
                    )}
                    <Field label="Nº de parcelas">
                        <input type="number" min="2" required
                            value={totalInstallments} onChange={(e) => setTotalInstallments(e.target.value)}
                            placeholder="Ex: 12" className={fieldCls} />
                    </Field>
                </div>

                {/* Preview */}
                {computedInstallmentValue && totalInstallments && (
                    <div className="border border-hud-border bg-hud-bg p-3 font-mono-hud text-[11px] uppercase tracking-widest">
                        <div className="flex justify-between text-hud-muted">
                            <span>Valor por parcela</span>
                            <span className="text-hud-cyan">
                                R$ {Number(computedInstallmentValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between text-hud-muted mt-1">
                            <span>Total a pagar</span>
                            <span className="text-hud-pink">
                                R$ {Number(computedTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Dia do vencimento">
                        <input type="number" min="1" max="31" required
                            value={dueDay} onChange={(e) => setDueDay(e.target.value)}
                            className={fieldCls} />
                    </Field>
                    <Field label="Categoria">
                        <select value={category} onChange={(e) => setCategory(e.target.value)}
                            className={fieldCls}>
                            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>
                </div>

                <button type="submit" disabled={loading}
                    className={`btn-hud mt-2 flex w-full items-center justify-center gap-2 border px-6 py-3 text-xs transition-all disabled:opacity-50 ${isEditing
                            ? "border-hud-yellow bg-hud-yellow/10 text-hud-yellow hover:bg-hud-yellow hover:text-black"
                            : "border-hud-purple bg-hud-purple/10 text-hud-purple hover:bg-hud-purple hover:text-white hover:shadow-glow-purple"
                        }`}>
                    {loading ? "SALVANDO..." : isEditing ? "SALVAR ALTERAÇÕES" : "REGISTRAR PARCELAMENTO"}
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