import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  TrendingUp, TrendingDown, Wallet, Plus, LogOut, AlertCircle, Clock,
  Trash2, Download, Printer, Cloud, CloudOff, Check, Bell, Target
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  BRL, formatDateBR, daysUntil, monthKey, monthLabelBR, CATEGORY_COLORS
} from "@/lib/format";
import { exportCSV, exportPDF } from "@/lib/exports";
import TransactionModal from "@/components/modals/TransactionModal";
import GoalModal from "@/components/modals/GoalModal";
import DepositModal from "@/components/modals/DepositModal";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { show } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState("lista");
  const [filter, setFilter] = useState("todos");
  const [month, setMonth] = useState("todos");
  const [txModal, setTxModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [depositGoal, setDepositGoal] = useState(null);

  const fetchData = useCallback(async () => {
    setSyncing(true);
    try {
      const [tx, g] = await Promise.all([api.get("/transactions"), api.get("/goals")]);
      setTransactions(tx.data || []);
      setGoals(g.data || []);
    } catch (err) {
      show("Erro ao carregar dados", "error");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [show]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Totals
  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === "receita").reduce((a, b) => a + Number(b.value), 0);
    const expense = transactions.filter((t) => t.type === "despesa").reduce((a, b) => a + Number(b.value), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => filter === "todos" || t.type === filter)
      .filter((t) => month === "todos" || monthKey(t.date) === month)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filter, month]);

  const monthlySeries = useMemo(() => {
    const map = new Map();
    transactions.forEach((t) => {
      const k = monthKey(t.date);
      if (!k) return;
      if (!map.has(k)) map.set(k, { month: k, receita: 0, despesa: 0 });
      const rec = map.get(k);
      rec[t.type] += Number(t.value);
    });
    return Array.from(map.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map((r) => ({ ...r, label: monthLabelBR(r.month) }));
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const map = new Map();
    transactions.filter((t) => t.type === "despesa").forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + Number(t.value));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const alerts = useMemo(() => {
    const arr = [];
    if (totals.balance < 0) arr.push({ kind: "danger", msg: `Saldo negativo: ${BRL(totals.balance)}` });
    goals.forEach((g) => {
      const pct = (Number(g.saved) / Number(g.target)) * 100;
      const d = daysUntil(g.deadline);
      if (pct < 100 && d <= 30 && d >= 0) {
        const missing = Math.max(0, Number(g.target) - Number(g.saved));
        arr.push({ kind: "warning", msg: `${g.emoji} ${g.name} — ${d} dia(s) restantes · faltam ${BRL(missing)}` });
      }
    });
    return arr;
  }, [totals.balance, goals]);

  // Handlers
  const addTransaction = async (data) => {
    setSyncing(true);
    try { const r = await api.post("/transactions", data); setTransactions((p) => [r.data, ...p]); show("Transação adicionada"); }
    catch { show("Erro ao adicionar transação", "error"); } finally { setSyncing(false); }
  };
  const deleteTransaction = async (id) => {
    setSyncing(true);
    try { await api.delete(`/transactions/${id}`); setTransactions((p) => p.filter((t) => t.id !== id)); show("Transação excluída"); }
    catch { show("Erro ao excluir", "error"); } finally { setSyncing(false); }
  };
  const addGoal = async (data) => {
    setSyncing(true);
    try { const r = await api.post("/goals", data); setGoals((p) => [...p, r.data]); show("Meta criada"); }
    catch { show("Erro ao criar meta", "error"); } finally { setSyncing(false); }
  };
  const depositGoalAction = async (g, amount) => {
    setSyncing(true);
    try { const r = await api.put(`/goals/${g.id}/deposit`, { amount }); setGoals((p) => p.map((x) => (x.id === g.id ? r.data : x))); show("Depósito registrado"); }
    catch { show("Erro no depósito", "error"); } finally { setSyncing(false); }
  };
  const deleteGoal = async (id) => {
    setSyncing(true);
    try { await api.delete(`/goals/${id}`); setGoals((p) => p.filter((g) => g.id !== id)); show("Meta removida"); }
    catch { show("Erro ao excluir meta", "error"); } finally { setSyncing(false); }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} color="#D4FF00" />
            <span className="font-serif-display text-2xl tracking-tight">FinançasPro</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              data-testid="sync-indicator"
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs sm:flex ${
                syncing ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {syncing ? <CloudOff size={12} /> : <Cloud size={12} />}
              {syncing ? "Sincronizando..." : "Sincronizado"}
            </div>
            <span className="hidden text-xs text-brand-muted md:inline" data-testid="header-user-email">{user?.email}</span>
            <button
              data-testid="logout-btn"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs transition-colors hover:border-brand-borderHover"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Hero */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-dim">Painel</p>
            <h1 className="font-serif-display mt-2 text-4xl tracking-tight md:text-5xl">
              Suas finanças, <em className="text-[#D4FF00] not-italic italic">em foco</em>.
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              data-testid="export-csv-btn"
              onClick={() => exportCSV(transactions, user)}
              className="flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-xs transition-colors hover:border-brand-borderHover"
            >
              <Download size={14} /> CSV
            </button>
            <button
              data-testid="export-pdf-btn"
              onClick={() => exportPDF({ transactions, goals, totals, user })}
              className="flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-xs transition-colors hover:border-brand-borderHover"
            >
              <Printer size={14} /> PDF
            </button>
            <button
              data-testid="new-transaction-btn"
              onClick={() => setTxModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#D4FF00] px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-[#B3D600]"
            >
              <Plus size={14} /> Nova transação
            </button>
            <button
              data-testid="new-goal-btn"
              onClick={() => setGoalModal(true)}
              className="flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-xs transition-colors hover:border-brand-borderHover"
            >
              <Target size={14} /> Nova meta
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard testid="summary-income" label="Receitas" value={totals.income} icon={<TrendingUp size={18} />} color="#D4FF00" loading={loading} />
          <SummaryCard testid="summary-expense" label="Despesas" value={totals.expense} icon={<TrendingDown size={18} />} color="#FF443A" loading={loading} />
          <SummaryCard testid="summary-balance" label="Saldo" value={totals.balance} icon={<Wallet size={18} />} color={totals.balance >= 0 ? "#3B82F6" : "#FF443A"} loading={loading} />
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mt-6 space-y-2" data-testid="alerts-panel">
            {alerts.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
                  a.kind === "danger"
                    ? "border-red-500/20 bg-red-500/10 text-red-400"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                }`}
              >
                {a.kind === "danger" ? <AlertCircle size={16} /> : <Clock size={16} />}
                <span>{a.msg}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 flex items-center gap-1 rounded-full border border-brand-border bg-brand-bg p-1">
          {[
            { id: "lista", label: "Lista" },
            { id: "graficos", label: "Gráficos" },
            { id: "metas", label: "Metas" },
          ].map((t) => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}-btn`}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-full px-4 py-2 text-sm transition-all ${
                tab === t.id ? "bg-brand-border text-white" : "text-brand-muted hover:text-brand-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {tab === "lista" && (
            <ListaTab
              loading={loading}
              transactions={filteredTransactions}
              filter={filter} setFilter={setFilter}
              month={month} setMonth={setMonth}
              months={availableMonths}
              onDelete={deleteTransaction}
            />
          )}
          {tab === "graficos" && (
            <GraficosTab loading={loading} monthlySeries={monthlySeries} expenseByCategory={expenseByCategory} />
          )}
          {tab === "metas" && (
            <MetasTab loading={loading} goals={goals} onDeposit={(g) => setDepositGoal(g)} onDelete={deleteGoal} />
          )}
        </div>
      </main>

      <TransactionModal open={txModal} onClose={() => setTxModal(false)} onSubmit={addTransaction} />
      <GoalModal open={goalModal} onClose={() => setGoalModal(false)} onSubmit={addGoal} />
      <DepositModal open={!!depositGoal} goal={depositGoal} onClose={() => setDepositGoal(null)} onSubmit={depositGoalAction} />
    </div>
  );
}

function SummaryCard({ label, value, icon, color, loading, testid }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      data-testid={testid}
      className="relative overflow-hidden rounded-xl border border-brand-border bg-brand-surface p-6 transition-all hover:border-brand-borderHover"
      style={{ boxShadow: `inset 0 1px 0 0 ${color}1a` }}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.25em] text-brand-dim">{label}</span>
        <span className="rounded-full p-1.5" style={{ background: `${color}14`, color }}>{icon}</span>
      </div>
      {loading ? (
        <div className="h-10 w-40 animate-pulse rounded-md bg-brand-surfaceHover" />
      ) : (
        <div className="font-serif-display text-4xl md:text-5xl" style={{ color }}>
          <CountUp end={value} duration={0.8} separator="." decimal="," decimals={2} prefix="R$ " preserveValue />
        </div>
      )}
    </motion.div>
  );
}

function ListaTab({ loading, transactions, filter, setFilter, month, setMonth, months, onDelete }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-border p-4">
        {["todos", "receita", "despesa"].map((f) => (
          <button
            key={f}
            data-testid={`filter-${f}-btn`}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs capitalize transition-all ${
              filter === f ? "bg-[#D4FF00] text-black" : "border border-brand-border text-brand-muted hover:text-brand-text"
            }`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto">
          <select
            data-testid="month-filter-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-full border border-brand-border bg-brand-bg px-3 py-1 text-xs text-brand-muted focus:border-[#D4FF00] focus:outline-none"
          >
            <option value="todos">Todos os meses</option>
            {months.map((m) => <option key={m} value={m}>{monthLabelBR(m)}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="transactions-table">
          <thead className="text-xs uppercase tracking-widest text-brand-dim">
            <tr>
              <th className="px-4 py-3 text-left">Descrição</th>
              <th className="px-4 py-3 text-left">Categoria</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t border-brand-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 animate-pulse rounded bg-brand-surfaceHover" /></td>
                  ))}
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-brand-muted">Nenhuma transação por aqui ainda.</td></tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="border-t border-brand-border transition-colors hover:bg-brand-surfaceHover" data-testid={`tx-row-${t.id}`}>
                  <td className="px-4 py-3">{t.description}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-brand-border bg-brand-bg px-2.5 py-0.5 text-xs text-brand-muted">{t.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs"
                      style={{
                        background: t.type === "receita" ? "rgba(212,255,0,0.10)" : "rgba(255,68,58,0.10)",
                        color: t.type === "receita" ? "#D4FF00" : "#FF443A",
                      }}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{formatDateBR(t.date)}</td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: t.type === "receita" ? "#D4FF00" : "#FF443A" }}>
                    {t.type === "receita" ? "+" : "-"}{BRL(t.value)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      data-testid={`delete-transaction-${t.id}`}
                      onClick={() => onDelete(t.id)}
                      className="rounded-full p-1.5 text-brand-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GraficosTab({ loading, monthlySeries, expenseByCategory }) {
  const tooltipStyle = { background: "rgba(18,18,21,0.95)", border: "1px solid #27272A", borderRadius: 8, padding: 8, backdropFilter: "blur(6px)" };
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-brand-border bg-brand-surface p-6" data-testid="chart-bar">
        <h3 className="mb-4 text-xs uppercase tracking-widest text-brand-dim">Receitas × Despesas por mês</h3>
        {loading ? <Skeleton h={280} /> : monthlySeries.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySeries}>
              <CartesianGrid stroke="#27272A" vertical={false} />
              <XAxis dataKey="label" stroke="#A1A1AA" fontSize={12} tickLine={false} />
              <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#F4F4F5" }} itemStyle={{ color: "#F4F4F5" }} formatter={(v) => BRL(v)} />
              <Legend wrapperStyle={{ color: "#A1A1AA", fontSize: 12 }} />
              <Bar dataKey="receita" name="Receita" fill="#D4FF00" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" name="Despesa" fill="#FF443A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="rounded-xl border border-brand-border bg-brand-surface p-6" data-testid="chart-pie">
        <h3 className="mb-4 text-xs uppercase tracking-widest text-brand-dim">Despesas por categoria</h3>
        {loading ? <Skeleton h={280} /> : expenseByCategory.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={expenseByCategory}
                dataKey="value" nameKey="name"
                innerRadius={55} outerRadius={100} paddingAngle={2}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {expenseByCategory.map((e, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[e.name] || "#A1A1AA"} stroke="#121215" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => BRL(v)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function MetasTab({ loading, goals, onDeposit, onDelete }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-brand-border bg-brand-surface" />
        ))}
      </div>
    );
  }
  if (goals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface p-10 text-center text-brand-muted" data-testid="goals-empty">
        Nenhuma meta ainda. Crie sua primeira com o botão “Nova meta”.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {goals.map((g) => <GoalCard key={g.id} goal={g} onDeposit={onDeposit} onDelete={onDelete} />)}
    </div>
  );
}

function GoalCard({ goal, onDeposit, onDelete }) {
  const pct = Math.min(100, (Number(goal.saved) / Number(goal.target)) * 100);
  const d = daysUntil(goal.deadline);
  const done = pct >= 100;
  const urgent = !done && d <= 30;
  const color = done ? "#D4FF00" : urgent ? "#FF443A" : "#3B82F6";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      data-testid={`goal-card-${goal.id}`}
      className="rounded-xl border border-brand-border bg-brand-surface p-6 transition-all hover:border-brand-borderHover"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl">{goal.emoji}</div>
          <div className="mt-2 text-lg font-medium">{goal.name}</div>
          <div className="mt-1 text-xs text-brand-muted">
            {done ? <span className="inline-flex items-center gap-1 text-[#D4FF00]"><Check size={12}/> Concluída</span>
              : urgent ? <span className="inline-flex items-center gap-1 text-red-400"><Bell size={12}/> {d} dia(s) restantes</span>
              : <span>{d} dia(s) até {formatDateBR(goal.deadline)}</span>}
          </div>
        </div>
        <button
          data-testid={`delete-goal-${goal.id}`}
          onClick={() => onDelete(goal.id)}
          className="rounded-full p-1.5 text-brand-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <div className="font-serif-display text-2xl" style={{ color }}>
            <CountUp end={Number(goal.saved)} duration={0.6} separator="." decimal="," decimals={2} prefix="R$ " preserveValue />
          </div>
          <div className="text-xs text-brand-muted">/ {BRL(goal.target)}</div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-bg">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ height: "100%", background: color }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-brand-muted">{pct.toFixed(0)}% concluído</span>
          <button
            data-testid={`deposit-goal-${goal.id}-btn`}
            onClick={() => onDeposit(goal)}
            className="rounded-full border border-brand-border bg-brand-bg px-3 py-1 text-xs transition-all hover:border-[#D4FF00] hover:text-[#D4FF00]"
          >
            + Depositar
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Skeleton({ h = 200 }) { return <div className="animate-pulse rounded-md bg-brand-surfaceHover" style={{ height: h }} />; }
function Empty() { return <div className="flex h-[280px] items-center justify-center text-sm text-brand-muted">Sem dados suficientes</div>; }
