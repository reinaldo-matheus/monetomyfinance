import ProfileModal from "@/components/modals/ProfileModal";
import InstallmentsTab from "@/pages/InstallmentsTab";
import BillsTab from "@/pages/BillsTab";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  Zap, TrendingUp, TrendingDown, Wallet, Plus, LogOut, AlertTriangle, Clock,
  Trash2, Download, Printer, Cloud, CloudOff, Check, Bell, Crosshair, Target, User
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { BRL, formatDateBR, daysUntil, monthKey, monthLabelBR, CATEGORY_COLORS } from "@/lib/format";
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
  const [bills, setBills] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [profileModal, setProfileModal] = useState(false);

  const fetchData = useCallback(async () => {
    setSyncing(true);
    try {
      const [tx, g, b, inst] = await Promise.all([
        api.get("/transactions"),
        api.get("/goals"),
        api.get("/bills"),
        api.get("/installments"),
      ]);
      setTransactions(tx.data || []);
      setGoals(g.data || []);
      setBills(b.data || []);
      setInstallments(inst.data || []);
    } catch { show("Erro ao carregar dados", "error"); }
    finally { setLoading(false); setSyncing(false); }
  }, [show]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      const k = monthKey(t.date); if (!k) return;
      if (!map.has(k)) map.set(k, { month: k, receita: 0, despesa: 0 });
      map.get(k)[t.type] += Number(t.value);
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map((r) => ({ ...r, label: monthLabelBR(r.month) }));
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const map = new Map();
    transactions.filter((t) => t.type === "despesa").forEach((t) => { map.set(t.category, (map.get(t.category) || 0) + Number(t.value)); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const alerts = useMemo(() => {
    const arr = [];
    if (totals.balance < 0) arr.push({ kind: "danger", msg: `Saldo negativo: ${BRL(totals.balance)}` });
    goals.forEach((g) => {
      const pct = (Number(g.saved) / Number(g.target)) * 100;
      const d = daysUntil(g.deadline);
      if (pct < 100 && d <= 30 && d >= 0) {
        arr.push({ kind: "warning", msg: `${g.emoji} ${g.name} — ${d} dia(s) · falta ${BRL(Math.max(0, Number(g.target) - Number(g.saved)))}` });
      }
    });
    return arr;
  }, [totals.balance, goals]);

  // handlers
  const addTransaction = async (data) => {
    setSyncing(true);
    try { const r = await api.post("/transactions", data); setTransactions((p) => [r.data, ...p]); show("ENTRADA REGISTRADA"); }
    catch { show("Erro ao adicionar transação", "error"); } finally { setSyncing(false); }
  };
  const deleteTransaction = async (id) => {
    setSyncing(true);
    try { await api.delete(`/transactions/${id}`); setTransactions((p) => p.filter((t) => t.id !== id)); show("ENTRADA REMOVIDA"); }
    catch { show("Erro ao excluir", "error"); } finally { setSyncing(false); }
  };
  const addGoal = async (data) => {
    setSyncing(true);
    try { const r = await api.post("/goals", data); setGoals((p) => [...p, r.data]); show("QUEST INICIADA"); }
    catch { show("Erro ao criar quest", "error"); } finally { setSyncing(false); }
  };
  const depositGoalAction = async (g, amount) => {
    setSyncing(true);
    try { const r = await api.put(`/goals/${g.id}/deposit`, { amount }); setGoals((p) => p.map((x) => (x.id === g.id ? r.data : x))); show("XP ADICIONADO"); }
    catch { show("Erro no depósito", "error"); } finally { setSyncing(false); }
  };
  const deleteGoal = async (id) => {
    setSyncing(true);
    try { await api.delete(`/goals/${id}`); setGoals((p) => p.filter((g) => g.id !== id)); show("QUEST ABANDONADA"); }
    catch { show("Erro ao excluir quest", "error"); } finally { setSyncing(false); }
  };

  return (
    <div className="relative min-h-screen bg-hud-bg text-hud-text">
      <div className="pointer-events-none fixed inset-0 bg-hud-grid opacity-30" />
      <div className="pointer-events-none fixed inset-0 bg-scanlines opacity-20" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-hud-border bg-hud-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center border border-hud-cyan">
              <span className="hud-bracket tl" /><span className="hud-bracket tr" /><span className="hud-bracket bl" /><span className="hud-bracket br" />
              <Zap size={16} className="text-hud-cyan" />
            </div>
            <div>
              <div className="font-display text-xl font-bold tracking-[0.3em] text-hud-cyan glow-cyan-text">MONETO</div>
              <div className="label-hud mt-0.5">// command.center</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              data-testid="sync-indicator"
              className="hidden items-center gap-1.5 border px-3 py-1 font-mono-hud text-[10px] uppercase tracking-widest sm:flex"
              style={{
                borderColor: syncing ? "#FFB800" : "#39FF14",
                color: syncing ? "#FFB800" : "#39FF14",
                boxShadow: syncing ? "0 0 10px rgba(255,184,0,.35)" : "0 0 10px rgba(57,255,20,.35)"
              }}
            >
              {syncing ? <CloudOff size={12} /> : <Cloud size={12} />}
              {syncing ? "SYNCING" : "SYNCED"}
            </div>
            <span className="hidden font-mono-hud text-[11px] text-hud-muted md:inline" data-testid="header-user-email">{user?.email}</span>
            <button
              data-testid="logout-btn" onClick={logout}
              className="btn-hud flex items-center gap-1.5 border border-hud-border bg-hud-surface px-3 py-1.5 text-[10px] text-hud-muted transition-all hover:border-hud-pink hover:text-hud-pink"
            >
              <LogOut size={12} /> SAIR
            </button>
            <button onClick={() => setProfileModal(true)}
              className="btn-hud flex items-center gap-1.5 border border-hud-border bg-hud-surface px-3 py-1.5 text-[10px] text-hud-muted transition-all hover:border-hud-cyan hover:text-hud-cyan">
              <User size={12} /> PERFIL
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Hero */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-hud">// dashboard.overview</p>
            <h1 className="font-display mt-2 text-4xl font-bold uppercase tracking-tight md:text-5xl">
              Control <span className="text-hud-cyan glow-cyan-text">Center</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <ToolbarBtn testid="export-csv-btn" icon={<Download size={12} />} label="CSV" onClick={() => exportCSV(transactions, user)} />
            <ToolbarBtn testid="export-pdf-btn" icon={<Printer size={12} />} label="PDF" onClick={() => exportPDF({ transactions, goals, totals, user })} />
            <ToolbarBtn
              testid="new-transaction-btn" icon={<Plus size={12} />} label="NOVA ENTRADA"
              onClick={() => setTxModal(true)} color="cyan" solid
            />
            <ToolbarBtn
              testid="new-goal-btn" icon={<Crosshair size={12} />} label="NOVA QUEST"
              onClick={() => setGoalModal(true)} color="purple"
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard testid="summary-income" label="// loot · entradas" value={totals.income} icon={<TrendingUp size={16} />} color="#39FF14" glowKey="glow-green" loading={loading} />
          <SummaryCard testid="summary-expense" label="// burn · saídas" value={totals.expense} icon={<TrendingDown size={16} />} color="#FF0055" glowKey="glow-pink" loading={loading} />
          <SummaryCard
            testid="summary-balance"
            label="// créditos · saldo" value={totals.balance}
            icon={<Wallet size={16} />}
            color={totals.balance >= 0 ? "#00F0FF" : "#FF0055"}
            glowKey={totals.balance >= 0 ? "glow-cyan" : "glow-pink"}
            loading={loading}
          />
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mt-6 space-y-2" data-testid="alerts-panel">
            {alerts.map((a, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="relative flex items-center gap-3 border bg-hud-surface px-4 py-3 font-mono-hud text-[11px] uppercase tracking-widest"
                style={{
                  borderColor: a.kind === "danger" ? "#FF0055" : "#FFB800",
                  color: a.kind === "danger" ? "#FF0055" : "#FFB800",
                  boxShadow: `0 0 12px ${a.kind === "danger" ? "rgba(255,0,85,.35)" : "rgba(255,184,0,.35)"}`,
                }}
              >
                {a.kind === "danger" ? <AlertTriangle size={14} /> : <Clock size={14} />}
                <span className="font-bold">{a.kind === "danger" ? "// ALERT" : "// HUD-WARN"}</span>
                <span className="text-hud-text normal-case tracking-normal">{a.msg}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 flex items-center gap-0 border border-hud-border bg-hud-bg">
          {[
            { id: "lista", label: "QUEST LOG" },
            { id: "graficos", label: "ANALYTICS" },
            { id: "metas", label: "QUESTS" },
            { id: "contas", label: "CONTAS FIXAS" },
            { id: "parcelamentos", label: "PARCELAMENTOS" },
          ].map((t, i) => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}-btn`}
              onClick={() => setTab(t.id)}
              className={`btn-hud flex-1 border-r border-hud-border px-4 py-3 text-xs transition-all last:border-r-0 ${tab === t.id ? "bg-hud-cyan text-black shadow-glow-cyan" : "text-hud-muted hover:text-hud-cyan"
                }`}
            >{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {tab === "lista" && (
            <ListaTab
              loading={loading} transactions={filteredTransactions}
              filter={filter} setFilter={setFilter} month={month} setMonth={setMonth}
              months={availableMonths} onDelete={deleteTransaction}
            />
          )}
          {tab === "graficos" && (
            <GraficosTab loading={loading} monthlySeries={monthlySeries} expenseByCategory={expenseByCategory} />
          )}
          {tab === "metas" && (
            <MetasTab loading={loading} goals={goals} onDeposit={(g) => setDepositGoal(g)} onDelete={deleteGoal} onCreate={() => setGoalModal(true)} />
          )}
          {tab === "contas" && <BillsTab />}
          {tab === "parcelamentos" && <InstallmentsTab />}
        </div>
      </main>

      <TransactionModal open={txModal} onClose={() => setTxModal(false)} onSubmit={addTransaction} />
      <GoalModal open={goalModal} onClose={() => setGoalModal(false)} onSubmit={addGoal} />
      <DepositModal open={!!depositGoal} goal={depositGoal} onClose={() => setDepositGoal(null)} onSubmit={depositGoalAction} />
      <ProfileModal open={profileModal} onClose={() => setProfileModal(false)} bills={bills} installments={installments} />
    </div>
  );
}

function ToolbarBtn({ icon, label, onClick, testid, color = "border", solid = false }) {
  const palette = {
    border: { border: "#27273A", text: "#A1A1AA", hover: "#00F0FF" },
    cyan: { border: "#00F0FF", text: "#00F0FF", hover: "#00F0FF" },
    purple: { border: "#B026FF", text: "#B026FF", hover: "#B026FF" },
  }[color];
  return (
    <button
      data-testid={testid} onClick={onClick}
      className="btn-hud flex items-center gap-1.5 border bg-hud-surface px-4 py-2 text-[10px] transition-all hover:text-black"
      style={{
        borderColor: palette.border,
        color: solid ? "#000" : palette.text,
        background: solid ? palette.hover : "transparent",
        boxShadow: solid ? `0 0 15px ${palette.hover}77` : "none",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = palette.hover; e.currentTarget.style.color = "#000"; e.currentTarget.style.boxShadow = `0 0 15px ${palette.hover}aa`; }}
      onMouseLeave={(e) => { if (!solid) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = palette.text; e.currentTarget.style.boxShadow = "none"; } }}
    >
      {icon} {label}
    </button>
  );
}

function SummaryCard({ label, value, icon, color, glowKey, loading, testid }) {
  const shadowMap = { "glow-cyan": "shadow-glow-cyan", "glow-pink": "shadow-glow-pink", "glow-green": "shadow-glow-green" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      data-testid={testid}
      className={`group relative overflow-hidden border border-hud-border bg-hud-surface p-6 transition-all hover:border-hud-cyan hover:${shadowMap[glowKey] || "shadow-glow-cyan"}`}
    >
      <span className="hud-bracket tl" style={{ borderColor: color }} />
      <span className="hud-bracket tr" style={{ borderColor: color }} />
      <span className="hud-bracket bl" style={{ borderColor: color }} />
      <span className="hud-bracket br" style={{ borderColor: color }} />
      <div className="scan-line" />

      <div className="mb-4 flex items-center justify-between">
        <span className="label-hud" style={{ color }}>{label}</span>
        <span className="flex h-7 w-7 items-center justify-center border" style={{ borderColor: color, color }}>{icon}</span>
      </div>
      {loading ? (
        <div className="h-10 w-48 animate-pulse bg-hud-surfaceHover" />
      ) : (
        <div className="font-display text-4xl font-bold md:text-5xl" style={{ color, textShadow: `0 0 15px ${color}99` }}>
          <CountUp end={value} duration={0.8} separator="." decimal="," decimals={2} prefix="CR " preserveValue />
        </div>
      )}
      <div className="label-hud mt-2" style={{ color: "#52525B" }}>//&nbsp;{value < 0 ? "debt detected" : "stable"}</div>
    </motion.div>
  );
}

function ListaTab({ loading, transactions, filter, setFilter, month, setMonth, months, onDelete }) {
  return (
    <div className="relative border border-hud-border bg-hud-surface">
      <span className="hud-bracket tl" /><span className="hud-bracket tr" /><span className="hud-bracket bl" /><span className="hud-bracket br" />
      <div className="flex flex-wrap items-center gap-2 border-b border-hud-border p-4">
        <span className="label-hud mr-2">FILTER_BY_TYPE:</span>
        {[
          { id: "todos", col: "#A1A1AA" },
          { id: "receita", col: "#39FF14" },
          { id: "despesa", col: "#FF0055" },
        ].map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id} data-testid={`filter-${f.id}-btn`} onClick={() => setFilter(f.id)}
              className="btn-hud border px-3 py-1 text-[10px] transition-all"
              style={{
                borderColor: active ? f.col : "#27273A",
                background: active ? f.col : "transparent",
                color: active ? "#000" : "#A1A1AA",
                boxShadow: active ? `0 0 10px ${f.col}88` : "none",
              }}
            >{f.id.toUpperCase()}</button>
          );
        })}
        <div className="ml-auto">
          <select
            data-testid="month-filter-select" value={month} onChange={(e) => setMonth(e.target.value)}
            className="border border-hud-border bg-hud-bg px-3 py-1 font-mono-hud text-xs uppercase tracking-wider text-hud-muted focus:border-hud-cyan focus:outline-none"
          >
            <option value="todos">ALL_MONTHS</option>
            {months.map((m) => <option key={m} value={m}>{monthLabelBR(m).toUpperCase()}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="transactions-table">
          <thead>
            <tr className="label-hud border-b border-hud-border">
              <th className="px-4 py-3 text-left">Descrição</th>
              <th className="px-4 py-3 text-left">Categoria</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-right">Valor (CR)</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="font-mono-hud text-xs">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-hud-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 animate-pulse bg-hud-surfaceHover" /></td>
                  ))}
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center font-mono-hud text-xs uppercase tracking-widest text-hud-muted">&gt; quest log vazio · registre sua primeira entrada</td></tr>
            ) : (
              transactions.map((t) => (
                <tr
                  key={t.id} data-testid={`tx-row-${t.id}`}
                  className="border-b border-hud-border transition-colors hover:bg-hud-cyan/5"
                >
                  <td className="px-4 py-3 font-sans text-sm text-hud-text">{t.description}</td>
                  <td className="px-4 py-3">
                    <span className="border border-hud-border bg-hud-bg px-2 py-0.5 text-[10px] uppercase tracking-wider text-hud-muted">{t.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{
                        borderColor: t.type === "receita" ? "#39FF14" : "#FF0055",
                        color: t.type === "receita" ? "#39FF14" : "#FF0055",
                        background: t.type === "receita" ? "rgba(57,255,20,.08)" : "rgba(255,0,85,.08)",
                      }}
                    >{t.type === "receita" ? "LOOT" : "BURN"}</span>
                  </td>
                  <td className="px-4 py-3 text-hud-muted">{formatDateBR(t.date)}</td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: t.type === "receita" ? "#39FF14" : "#FF0055" }}>
                    {t.type === "receita" ? "+" : "−"}{BRL(t.value)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      data-testid={`delete-transaction-${t.id}`} onClick={() => onDelete(t.id)}
                      className="border border-hud-border p-1.5 text-hud-muted transition-all hover:border-hud-pink hover:text-hud-pink hover:shadow-glow-pink"
                    ><Trash2 size={12} /></button>
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
  const tooltipStyle = { background: "#0C0C14", border: "1px solid #00F0FF", borderRadius: 0, padding: 8, fontFamily: "JetBrains Mono" };
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard testid="chart-bar" label="// monthly.flow · receitas × despesas" color="#00F0FF">
        {loading ? <Skeleton h={280} /> : monthlySeries.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySeries}>
              <CartesianGrid stroke="#27273A" vertical={false} />
              <XAxis dataKey="label" stroke="#A1A1AA" fontSize={11} tickLine={false} style={{ fontFamily: "JetBrains Mono" }} />
              <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} style={{ fontFamily: "JetBrains Mono" }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#F8F8FF" }} itemStyle={{ color: "#F8F8FF" }} formatter={(v) => BRL(v)} cursor={{ fill: "rgba(0,240,255,0.05)" }} />
              <Legend wrapperStyle={{ color: "#A1A1AA", fontSize: 11, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: "0.1em" }} />
              <Bar dataKey="receita" name="LOOT" fill="#39FF14" />
              <Bar dataKey="despesa" name="BURN" fill="#FF0055" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <ChartCard testid="chart-pie" label="// burn.distribution · despesas por categoria" color="#B026FF">
        {loading ? <Skeleton h={280} /> : expenseByCategory.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={expenseByCategory} dataKey="value" nameKey="name"
                innerRadius={55} outerRadius={100} paddingAngle={3}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {expenseByCategory.map((e, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[e.name] || "#A1A1AA"} stroke="#0C0C14" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => BRL(v)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ label, color, testid, children }) {
  return (
    <div data-testid={testid} className="relative border border-hud-border bg-hud-surface p-6">
      <span className="hud-bracket tl" style={{ borderColor: color }} />
      <span className="hud-bracket tr" style={{ borderColor: color }} />
      <span className="hud-bracket bl" style={{ borderColor: color }} />
      <span className="hud-bracket br" style={{ borderColor: color }} />
      <h3 className="label-hud mb-4" style={{ color }}>{label}</h3>
      {children}
    </div>
  );
}

function MetasTab({ loading, goals, onDeposit, onDelete, onCreate }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-40 animate-pulse border border-hud-border bg-hud-surface" />)}
      </div>
    );
  }
  if (goals.length === 0) {
    return (
      <div className="relative border border-dashed border-hud-border bg-hud-surface p-10 text-center" data-testid="goals-empty">
        <Target className="mx-auto mb-3 text-hud-muted" size={32} />
        <p className="font-mono-hud text-xs uppercase tracking-widest text-hud-muted">&gt; nenhuma quest ativa</p>
        <button
          onClick={onCreate}
          className="btn-hud mt-4 border border-hud-purple bg-hud-purple/10 px-4 py-2 text-[11px] text-hud-purple transition-all hover:bg-hud-purple hover:text-white hover:shadow-glow-purple"
        >INICIAR PRIMEIRA QUEST</button>
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
  const color = done ? "#39FF14" : urgent ? "#FF0055" : "#00F0FF";
  const xpClass = done ? "done" : urgent ? "danger" : "";
  const shadow = done ? "shadow-glow-green" : urgent ? "shadow-glow-pink" : "shadow-glow-cyan";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      data-testid={`goal-card-${goal.id}`}
      className={`relative border border-hud-border bg-hud-surface p-6 transition-all hover:${shadow}`}
      style={{ boxShadow: `inset 3px 0 0 0 ${color}` }}
    >
      <span className="hud-bracket tl" style={{ borderColor: color }} />
      <span className="hud-bracket tr" style={{ borderColor: color }} />
      <span className="hud-bracket bl" style={{ borderColor: color }} />
      <span className="hud-bracket br" style={{ borderColor: color }} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl">{goal.emoji}</div>
          <div className="label-hud mt-2" style={{ color }}>// QUEST</div>
          <div className="font-heading mt-0.5 text-xl font-bold uppercase tracking-wider">{goal.name}</div>
          <div className="mt-1 font-mono-hud text-[10px] uppercase tracking-widest">
            {done ? <span className="inline-flex items-center gap-1 text-hud-green"><Check size={11} /> completa</span>
              : urgent ? <span className="inline-flex items-center gap-1 text-hud-pink"><Bell size={11} /> {d} dia(s) restantes</span>
                : <span className="text-hud-muted">{d} dia(s) até {formatDateBR(goal.deadline)}</span>}
          </div>
        </div>
        <button
          data-testid={`delete-goal-${goal.id}`} onClick={() => onDelete(goal.id)}
          className="border border-hud-border p-1.5 text-hud-muted transition-all hover:border-hud-pink hover:text-hud-pink"
        ><Trash2 size={12} /></button>
      </div>
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <div className="font-display text-3xl font-bold" style={{ color, textShadow: `0 0 15px ${color}88` }}>
            <CountUp end={Number(goal.saved)} duration={0.6} separator="." decimal="," decimals={2} prefix="CR " preserveValue />
          </div>
          <div className="font-mono-hud text-[11px] uppercase tracking-widest text-hud-muted">/ {BRL(goal.target)}</div>
        </div>
        <div className="mt-3 h-3 w-full border border-hud-border bg-hud-bg">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
            className={`xp-bar-fill ${xpClass}`}
            style={{ height: "100%" }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between font-mono-hud text-[10px] uppercase tracking-widest">
          <span className="text-hud-muted">XP {pct.toFixed(0)}%</span>
          <button
            data-testid={`deposit-goal-${goal.id}-btn`} onClick={() => onDeposit(goal)}
            className="btn-hud border border-hud-cyan bg-hud-cyan/10 px-3 py-1 text-[10px] text-hud-cyan transition-all hover:bg-hud-cyan hover:text-black hover:shadow-glow-cyan"
          >+ DEPOSITAR XP</button>
        </div>
      </div>
    </motion.div>
  );
}

function Skeleton({ h = 200 }) { return <div className="animate-pulse bg-hud-surfaceHover" style={{ height: h }} />; }
function Empty() { return <div className="flex h-[280px] items-center justify-center font-mono-hud text-xs uppercase tracking-widest text-hud-muted">&gt; sem dados suficientes</div>; }
