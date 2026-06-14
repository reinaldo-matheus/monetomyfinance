import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import {
    INCOME_CATEGORIES_PF, INCOME_CATEGORIES_PJ,
    EXPENSE_CATEGORIES_PF, EXPENSE_CATEGORIES_PJ,
} from "@/lib/format";
import CurrencyInput from "@/components/CurrencyInput";

export default function EditTransactionModal({ open, onClose, onSubmit, transaction, profileType = "pf" }) {
    const [type, setType] = useState("despesa");
    const [description, setDescription] = useState("");
    const [value, setValue] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(false);

    const INCOME_CATS = profileType === "pj" ? INCOME_CATEGORIES_PJ : INCOME_CATEGORIES_PF;
    const EXPENSE_CATS = profileType === "pj" ? EXPENSE_CATEGORIES_PJ : EXPENSE_CATEGORIES_PF;
    const cats = type === "receita" ? INCOME_CATS : EXPENSE_CATS;

    // Preenche os campos com os dados da transação ao abrir
    useEffect(() => {
        if (open && transaction) {
            setType(transaction.type);
            setDescription(transaction.description);
            setValue(String(transaction.value));
            setCategory(transaction.category);
            setDate(transaction.date);
        }
    }, [open, transaction]);

    const switchType = (t) => {
        setType(t);
        setCategory(t === "receita" ? INCOME_CATS[0] : EXPENSE_CATS[0]);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!description.trim() || !value || Number(value) <= 0) return;
        setLoading(true);
        try {
            await onSubmit(transaction.id, {
                type,
                description: description.trim(),
                value: Number(value),
                category,
                date,
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!transaction) return null;

    return (
        <Modal open={open} onClose={onClose} title="Editar Entrada" testid="edit-transaction-modal">
            <form onSubmit={submit} className="space-y-4">
                {/* Tipo */}
                <div className="flex border border-hud-border bg-hud-bg p-1">
                    {["receita", "despesa"].map((t) => {
                        const isActive = type === t;
                        return (
                            <button
                                key={t} type="button"
                                onClick={() => switchType(t)}
                                className={`btn-hud flex-1 px-4 py-2.5 text-xs transition-all ${isActive
                                    ? t === "receita"
                                        ? "bg-hud-green text-black shadow-glow-green"
                                        : "bg-hud-pink text-white shadow-glow-pink"
                                    : "text-hud-muted hover:text-hud-cyan"
                                    }`}
                            >
                                {t === "receita" ? "+ LOOT" : "− BURN"}
                            </button>
                        );
                    })}
                </div>

                {/* Descrição */}
                <Field label="Descrição">
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        placeholder="Ex: Supermercado"
                        className={fieldCls}
                    />
                </Field>

                {/* Valor + Data */}
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Valor (CR)">
                        <CurrencyInput
                            value={value}
                            onChange={setValue}
                            required
                            className={fieldCls}
                        />
                    </Field>
                    <Field label="Data">
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={fieldCls}
                        />
                    </Field>
                </div>

                {/* Categoria */}
                <Field label="Categoria">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={fieldCls}
                    >
                        {cats.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </Field>

                {/* Badge modo ativo */}
                <div className="flex items-center gap-2 font-mono-hud text-[10px] uppercase tracking-widest text-hud-muted">
                    <span>// modo:</span>
                    <span className={`border px-2 py-0.5 font-bold ${profileType === "pj"
                        ? "border-hud-purple text-hud-purple"
                        : "border-hud-cyan text-hud-cyan"
                        }`}>
                        {profileType === "pj" ? "🏢 pessoa jurídica" : "👤 pessoa física"}
                    </span>
                </div>

                {/* Botão salvar */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-hud mt-2 flex w-full items-center justify-center gap-2 border border-hud-yellow bg-hud-yellow/10 px-6 py-3 text-xs text-hud-yellow transition-all hover:bg-hud-yellow hover:text-black disabled:opacity-50"
                >
                    {loading ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
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