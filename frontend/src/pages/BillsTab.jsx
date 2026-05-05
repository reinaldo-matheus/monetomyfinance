import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Trash2, Plus, CheckCircle, Circle, AlertTriangle, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { BRL } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import BillModal from "@/components/modals/BillModal";

export default function BillsTab({ onRefresh }) {
    const { show } = useToast();
    const [bills, setBills] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [billModal, setBillModal] = useState(false);
    const [editingBill, setEditingBill] = useState(null);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthLabel = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [b, p] = await Promise.all([
                api.get("/bills"),
                api.get(`/bills/payments?month=${currentMonth}`)
            ]);
            setBills(b.data || []);
            setPayments(p.data || []);
        } catch { show("Erro ao carregar contas", "error"); }
        finally { setLoading(false); }
    }, [currentMonth, show]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const paidIds = useMemo(() => new Set(payments.map((p) => p.bill_id)), [payments]);

    const totalValue = useMemo(() => bills.reduce((a, b) => a + Number(b.value), 0), [bills]);
    const paidValue = useMemo(() =>
        bills.filter((b) => paidIds.has(b.id)).reduce((a, b) => a + Number(b.value), 0),
        [bills, paidIds]);

    const handlePay = async (bill) => {
        try {
            await api.post(`/bills/${bill.id}/pay`);
            show(`${bill.emoji} ${bill.name} pago! Transação criada.`);
            fetchData();
            if (onRefresh) onRefresh(); // ← adiciona essa linha
        } catch (err) {
            show(err.response?.data?.detail || "Erro ao pagar", "error");
        }
    };

    const handleUnpay = async (bill) => {
        try {
            await api.delete(`/bills/${bill.id}/pay`);
            show(`${bill.emoji} ${bill.name} desmarcado`);
            fetchData();
        } catch { show("Erro ao desmarcar", "error"); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/bills/${id}`);
            show("Conta removida");
            fetchData();
        } catch { show("Erro ao remover", "error"); }
    };

    const handleAdd = async (data) => {
        await api.post("/bills", data);
        show("Conta adicionada!");
        fetchData();
    };

    const handleEdit = async (data) => {
        await api.put(`/bills/${editingBill.id}`, data);
        show("Conta atualizada!");
        fetchData();
    };

    const openEdit = (bill) => {
        setEditingBill(bill);
        setBillModal(true);
    };

    const closeModal = () => {
        setBillModal(false);
        setEditingBill(null);
    };

    const pct = totalValue > 0 ? (paidValue / totalValue) * 100 : 0;

    if (loading) return (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse border border-hud-border bg-hud-surface" />
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
                        <span className="label-hud">// CONTAS FIXAS · {monthLabel.toUpperCase()}</span>
                        <div className="font-display mt-1 text-2xl font-bold text-hud-cyan glow-cyan-text">
                            {BRL(paidValue)} <span className="text-hud-muted text-lg">/ {BRL(totalValue)}</span>
                        </div>
                    </div>
                    <button onClick={() => { setEditingBill(null); setBillModal(true); }}
                        className="btn-hud flex items-center gap-2 border border-hud-cyan bg-hud-cyan/10 px-4 py-2 text-xs text-hud-cyan transition-all hover:bg-hud-cyan hover:text-black hover:shadow-glow-cyan">
                        <Plus size={12} /> NOVA CONTA
                    </button>
                </div>
                <div className="mb-1 flex justify-between font-mono-hud text-[10px] uppercase tracking-widest text-hud-muted">
                    <span>{bills.filter(b => paidIds.has(b.id)).length}/{bills.length} pagas</span>
                    <span>{pct.toFixed(0)}%</span>
                </div>
                <div className="h-3 w-full border border-hud-border bg-hud-bg">
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`xp-bar-fill ${pct >= 100 ? "done" : pct >= 50 ? "" : "danger"}`}
                        style={{ height: "100%" }}
                    />
                </div>
            </div>

            {/* Lista */}
            {bills.length === 0 ? (
                <div className="border border-dashed border-hud-border bg-hud-surface p-10 text-center">
                    <p className="font-mono-hud text-xs uppercase tracking-widest text-hud-muted">
                        &gt; nenhuma conta fixa cadastrada
                    </p>
                    <button onClick={() => { setEditingBill(null); setBillModal(true); }}
                        className="btn-hud mt-4 border border-hud-cyan bg-hud-cyan/10 px-4 py-2 text-[11px] text-hud-cyan transition-all hover:bg-hud-cyan hover:text-black hover:shadow-glow-cyan">
                        ADICIONAR PRIMEIRA CONTA
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {bills.map((bill) => {
                        const paid = paidIds.has(bill.id);
                        const today = new Date().getDate();
                        const urgent = !paid && bill.due_day <= today + 3 && bill.due_day >= today;
                        const overdue = !paid && bill.due_day < today;
                        const color = paid ? "#39FF14" : overdue ? "#FF0055" : urgent ? "#FFB800" : "#00F0FF";

                        return (
                            <motion.div key={bill.id}
                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                className="relative flex items-center justify-between border border-hud-border bg-hud-surface px-4 py-3 transition-all"
                                style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                            >
                                <div className="flex items-center gap-3">
                                    <button onClick={() => paid ? handleUnpay(bill) : handlePay(bill)}
                                        className="transition-all hover:scale-110">
                                        {paid
                                            ? <CheckCircle size={20} style={{ color: "#39FF14" }} />
                                            : <Circle size={20} className="text-hud-muted hover:text-hud-cyan" />
                                        }
                                    </button>
                                    <span className="text-2xl">{bill.emoji}</span>
                                    <div>
                                        <div className={`font-heading font-bold uppercase tracking-wide ${paid ? "line-through text-hud-muted" : "text-hud-text"}`}>
                                            {bill.name}
                                        </div>
                                        <div className="font-mono-hud text-[10px] uppercase tracking-widest text-hud-muted flex items-center gap-2">
                                            <span>{bill.category}</span>
                                            <span>·</span>
                                            <span style={{ color: overdue ? "#FF0055" : urgent ? "#FFB800" : "#52525B" }}>
                                                {overdue && <AlertTriangle size={10} className="inline mr-1" />}
                                                vence dia {bill.due_day}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-display font-bold" style={{ color }}>
                                        {BRL(bill.value)}
                                    </span>
                                    <button onClick={() => openEdit(bill)}
                                        className="border border-hud-border p-1.5 text-hud-muted transition-all hover:border-hud-yellow hover:text-hud-yellow">
                                        <Pencil size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(bill.id)}
                                        className="border border-hud-border p-1.5 text-hud-muted transition-all hover:border-hud-pink hover:text-hud-pink">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <BillModal
                open={billModal}
                onClose={closeModal}
                onSubmit={editingBill ? handleEdit : handleAdd}
                editingBill={editingBill}
            />
        </div>
    );
}