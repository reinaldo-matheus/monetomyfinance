import { useEffect, useState, useCallback } from "react";
import { User, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import { BRL } from "@/lib/format";
import { useToast } from "@/context/ToastContext";

export default function ProfileModal({ open, onClose, bills, installments }) {
    const { show } = useToast();
    const [displayName, setDisplayName] = useState("");
    const [monthlyIncome, setMonthlyIncome] = useState("");
    const [savingsGoalPct, setSavingsGoalPct] = useState("20");
    const [loading, setLoading] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const r = await api.get("/profile");
            setDisplayName(r.data.display_name || "");
            setMonthlyIncome(r.data.monthly_income ? String(r.data.monthly_income) : "");
            setSavingsGoalPct(String(r.data.savings_goal_pct || 20));
        } catch { }
    }, []);

    useEffect(() => { if (open) fetchProfile(); }, [open, fetchProfile]);

    const income = Number(monthlyIncome) || 0;
    const savingsGoal = (income * Number(savingsGoalPct)) / 100;
    const totalBills = bills.reduce((a, b) => a + Number(b.value), 0);
    const totalInstallments = installments.reduce((a, i) =>
        a + (i.total_installments - i.paid_installments) > 0 ? a + i.installment_value : a, 0);
    const totalCommitted = totalBills + totalInstallments;
    const available = income - totalCommitted;
    const committedPct = income > 0 ? (totalCommitted / income) * 100 : 0;
    const savingsPct = Number(savingsGoalPct);

    const healthColor = committedPct > 80 ? "#FF0055" : committedPct > 60 ? "#FFB800" : "#39FF14";
    const healthLabel = committedPct > 80 ? "CRÍTICO" : committedPct > 60 ? "ATENÇÃO" : "SAUDÁVEL";

    const submit = async (e) => {
        e.preventDefault();
        if (!displayName.trim()) return;
        setLoading(true);
        try {
            await api.put("/profile", {
                display_name: displayName.trim(),
                monthly_income: Number(monthlyIncome) || 0,
                savings_goal_pct: Number(savingsGoalPct) || 20,
            });
            show("Perfil atualizado!");
            onClose();
        } catch { show("Erro ao salvar perfil", "error"); }
        finally { setLoading(false); }
    };

    return (
        <Modal open={open} onClose={onClose} title="Perfil do Jogador" testid="profile-modal">
            <form onSubmit={submit} className="space-y-4">
                {/* Campos */}
                <Field label="Nome de exibição">
                    <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        required placeholder="Ex: Matheus" className={fieldCls} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Renda mensal líquida (CR)">
                        <input type="number" step="0.01" min="0"
                            value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)}
                            placeholder="0,00" className={fieldCls} />
                    </Field>
                    <Field label="Meta de economia (%)">
                        <input type="number" min="0" max="100"
                            value={savingsGoalPct} onChange={(e) => setSavingsGoalPct(e.target.value)}
                            className={fieldCls} />
                    </Field>
                </div>

                {/* Painel de saúde financeira */}
                {income > 0 && (
                    <div className="border border-hud-border bg-hud-bg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="label-hud">// SAÚDE FINANCEIRA</span>
                            <span className="font-mono-hud text-[10px] font-bold uppercase tracking-widest"
                                style={{ color: healthColor }}>
                                {committedPct > 80
                                    ? <AlertTriangle size={10} className="inline mr-1" />
                                    : <CheckCircle size={10} className="inline mr-1" />
                                }
                                {healthLabel}
                            </span>
                        </div>

                        {[
                            { label: "Renda líquida", value: income, color: "#39FF14" },
                            { label: `Meta de economia (${savingsPct}%)`, value: savingsGoal, color: "#00F0FF" },
                            { label: "Contas fixas", value: totalBills, color: "#FFB800" },
                            { label: "Parcelamentos/mês", value: totalInstallments, color: "#B026FF" },
                            { label: "Total comprometido", value: totalCommitted, color: healthColor },
                            { label: "Disponível real", value: available, color: available >= 0 ? "#39FF14" : "#FF0055" },
                        ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between font-mono-hud text-[11px]">
                                <span className="text-hud-muted uppercase tracking-widest">{row.label}</span>
                                <span className="font-bold" style={{ color: row.color }}>{BRL(row.value)}</span>
                            </div>
                        ))}

                        {/* Barra comprometido */}
                        <div>
                            <div className="mb-1 flex justify-between font-mono-hud text-[10px] text-hud-muted uppercase">
                                <span>Comprometido</span>
                                <span style={{ color: healthColor }}>{committedPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full border border-hud-border bg-hud-bg">
                                <div className="h-full transition-all duration-700"
                                    style={{
                                        width: `${Math.min(committedPct, 100)}%`,
                                        background: healthColor,
                                        boxShadow: `0 0 8px ${healthColor}88`
                                    }} />
                            </div>
                        </div>
                    </div>
                )}

                <button type="submit" disabled={loading}
                    className="btn-hud mt-2 flex w-full items-center justify-center gap-2 border border-hud-cyan bg-hud-cyan/10 px-6 py-3 text-xs text-hud-cyan transition-all hover:bg-hud-cyan hover:text-black hover:shadow-glow-cyan disabled:opacity-50">
                    {loading ? "SALVANDO..." : "SALVAR PERFIL"}
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