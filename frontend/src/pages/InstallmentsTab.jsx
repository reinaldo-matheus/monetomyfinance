import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Trash2, Plus, CheckCircle, Pencil, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { BRL } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import InstallmentModal from "@/components/modals/InstallmentModal";

export default function InstallmentsTab({ onRefresh }) {
    const { show } = useToast();
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editingInstallment, setEditingInstallment] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get("/installments");
            setInstallments(r.data || []);
        } catch { show("Erro ao carregar parcelamentos", "error"); }
        finally { setLoading(false); }
    }, [show]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalDebt = useMemo(() =>
        installments.reduce((a, i) => a + (i.total_installments - i.paid_installments) * i.installment_value, 0),
        [installments]);

    const totalPaid = useMemo(() =>
        installments.reduce((a, i) => a + i.paid_installments * i.installment_value, 0),
        [installments]);

    const handleAdd = async (data) => {
        await api.post("/installments", data);
        show("Parcelamento registrado!");
        fetchData();
    };

    const handleEdit = async (data) => {
        await api.put(`/installments/${editingInstallment.id}`, data);
        show("Parcelamento atualizado!");
        fetchData();
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/installments/${id}`);
            show("Parcelamento removido");
            fetchData();
        } catch { show("Erro ao remover", "error"); }
    };

    const handlePay = async (inst) => {
        try {
            await api.post(`/installments/${inst.id}/pay`);
            show(`${inst.emoji} Parcela ${inst.paid_installments + 1}/${inst.total_installments} paga!`);
            fetchData();
            if (onRefresh) onRefresh(); // ← adiciona essa linha
        } catch (err) {
            show(err.response?.data?.detail || "Erro ao pagar parcela", "error");
        }
    };

    const handleUnpay = async (inst) => {
        try {
            await api.delete(`/installments/${inst.id}/pay`);
            show(`↩ Parcela desfeita — ${inst.name}`);
            fetchData();
            if (onRefresh) onRefresh();
        } catch (err) {
            show(err.response?.data?.detail || "Erro ao desfazer", "error");
        }
    };

    const openEdit = (inst) => { setEditingInstallment(inst); setModal(true); };
    const closeModal = () => { setModal(false); setEditingInstallment(null); };

    if (loading) return (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse border border-hud-border bg-hud-surface" />
            ))}
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="relative border border-hud-border bg-hud-surface p-5">
                <span className="hud-bracket tl" /><span className="hud-bracket tr" />
                <span className="hud-bracket bl" /><span className="hud-bracket br" />
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="label-hud">// PARCELAMENTOS ATIVOS</span>
                        <div className="font-display mt-1 text-2xl font-bold text-hud-pink glow-pink-text">
                            {BRL(totalDebt)} <span className="text-hud-muted text-lg">restante</span>
                        </div>
                        <div className="font-mono-hud text-[11px] text-hud-muted mt-1">
                            {BRL(totalPaid)} já pago no total
                        </div>
                    </div>
                    <button onClick={() => { setEditingInstallment(null); setModal(true); }}
                        className="btn-hud flex items-center gap-2 border border-hud-purple bg-hud-purple/10 px-4 py-2 text-xs text-hud-purple transition-all hover:bg-hud-purple hover:text-white hover:shadow-glow-purple">
                        <Plus size={12} /> NOVO PARCELAMENTO
                    </button>
                </div>
            </div>

            {/* Lista */}
            {installments.length === 0 ? (
                <div className="border border-dashed border-hud-border bg-hud-surface p-10 text-center">
                    <CreditCard className="mx-auto mb-3 text-hud-muted" size={32} />
                    <p className="font-mono-hud text-xs uppercase tracking-widest text-hud-muted">
                        &gt; nenhum parcelamento registrado
                    </p>
                    <button onClick={() => { setEditingInstallment(null); setModal(true); }}
                        className="btn-hud mt-4 border border-hud-purple bg-hud-purple/10 px-4 py-2 text-[11px] text-hud-purple transition-all hover:bg-hud-purple hover:text-white hover:shadow-glow-purple">
                        REGISTRAR PRIMEIRO PARCELAMENTO
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {installments.map((inst) => {
                        const pct = (inst.paid_installments / inst.total_installments) * 100;
                        const done = inst.paid_installments >= inst.total_installments;
                        const remaining = inst.total_installments - inst.paid_installments;
                        const color = done ? "#39FF14" : pct >= 50 ? "#00F0FF" : "#FF0055";

                        return (
                            <motion.div key={inst.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="relative border border-hud-border bg-hud-surface p-4 transition-all"
                                style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{inst.emoji}</span>
                                        <div>
                                            <div className={`font-heading font-bold uppercase tracking-wide ${done ? "text-hud-green" : "text-hud-text"}`}>
                                                {inst.name}
                                                {done && <span className="ml-2 text-[10px] text-hud-green border border-hud-green px-1.5 py-0.5">QUITADO</span>}
                                            </div>
                                            <div className="font-mono-hud text-[10px] uppercase tracking-widest text-hud-muted flex items-center gap-2 mt-0.5">
                                                <span>{inst.category}</span>
                                                <span>·</span>
                                                <span>vence dia {inst.due_day}</span>
                                                <span>·</span>
                                                <span style={{ color }}>{inst.paid_installments}/{inst.total_installments} parcelas</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <div className="font-display font-bold text-sm" style={{ color }}>
                                                {BRL(inst.installment_value)}<span className="text-hud-muted text-xs">/mês</span>
                                            </div>
                                            <div className="font-mono-hud text-[10px] text-hud-muted">
                                                {done ? "quitado" : `${remaining}x restantes`}
                                            </div>
                                        </div>
                                        <button onClick={() => openEdit(inst)}
                                            className="border border-hud-border p-1.5 text-hud-muted transition-all hover:border-hud-yellow hover:text-hud-yellow">
                                            <Pencil size={12} />
                                        </button>
                                        <button onClick={() => handleDelete(inst.id)}
                                            className="border border-hud-border p-1.5 text-hud-muted transition-all hover:border-hud-pink hover:text-hud-pink">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Barra de progresso */}
                                <div className="mb-2 h-2 w-full border border-hud-border bg-hud-bg">
                                    <motion.div
                                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className={`xp-bar-fill ${done ? "done" : pct >= 50 ? "" : "danger"}`}
                                        style={{ height: "100%" }}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="font-mono-hud text-[10px] uppercase tracking-widest text-hud-muted">
                                        {pct.toFixed(0)}% · total {BRL(inst.total_installments * inst.installment_value)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {inst.paid_installments > 0 && (
                                            <button onClick={() => handleUnpay(inst)}
                                                className="btn-hud flex items-center gap-1.5 border border-hud-yellow bg-hud-yellow/10 px-3 py-1 text-[10px] text-hud-yellow transition-all hover:bg-hud-yellow hover:text-black">
                                                ↩ DESFAZER
                                            </button>
                                        )}
                                        {!done && (
                                            <button onClick={() => handlePay(inst)}
                                                className="btn-hud flex items-center gap-1.5 border border-hud-cyan bg-hud-cyan/10 px-3 py-1 text-[10px] text-hud-cyan transition-all hover:bg-hud-cyan hover:text-black hover:shadow-glow-cyan">
                                                <CheckCircle size={10} /> PAGAR PARCELA {inst.paid_installments + 1}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <InstallmentModal
                open={modal}
                onClose={closeModal}
                onSubmit={editingInstallment ? handleEdit : handleAdd}
                editingInstallment={editingInstallment}
            />
        </div>
    );
}