import { BRL, formatDateBR } from "@/lib/format";

export function exportCSV(transactions, user) {
  const BOM = "\uFEFF";
  const header = ["Data", "Descrição", "Categoria", "Tipo", "Valor"].join(";");
  const rows = transactions.map((t) =>
    [formatDateBR(t.date), `"${t.description.replace(/"/g, '""')}"`, t.category, t.type, Number(t.value).toFixed(2).replace(".", ",")].join(";")
  );
  const income = transactions.filter((t) => t.type === "receita").reduce((a, b) => a + Number(b.value), 0);
  const expense = transactions.filter((t) => t.type === "despesa").reduce((a, b) => a + Number(b.value), 0);
  const footer = [
    "",
    `Total Receitas;${income.toFixed(2).replace(".", ",")}`,
    `Total Despesas;${expense.toFixed(2).replace(".", ",")}`,
    `Saldo;${(income - expense).toFixed(2).replace(".", ",")}`,
  ].join("\n");
  const csv = BOM + [header, ...rows].join("\n") + "\n" + footer;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `financaspro-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF({ transactions, goals, totals, user }) {
  const w = window.open("", "_blank");
  if (!w) return;
  const style = `
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; padding: 32px; }
      h1 { font-size: 24px; margin: 0 0 4px; }
      .sub { color: #666; font-size: 12px; margin-bottom: 24px; }
      .cards { display: flex; gap: 12px; margin-bottom: 24px; }
      .card { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
      .card .lbl { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: .15em; }
      .card .val { font-size: 22px; font-weight: 600; margin-top: 6px; }
      h2 { font-size: 16px; margin: 24px 0 10px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
      th { background: #f5f5f5; }
      .footer { margin-top: 24px; font-size: 11px; color: #888; }
      .badge-in { color: #059669; font-weight: 600; }
      .badge-out { color: #dc2626; font-weight: 600; }
      @media print { body { padding: 16px; } }
    </style>`;
  const rows = transactions
    .map(
      (t) => `<tr>
        <td>${formatDateBR(t.date)}</td>
        <td>${t.description}</td>
        <td>${t.category}</td>
        <td class="${t.type === "receita" ? "badge-in" : "badge-out"}">${t.type}</td>
        <td>${BRL(t.value)}</td>
      </tr>`
    )
    .join("");
  const goalRows = goals
    .map((g) => {
      const pct = Math.min(100, Math.round((Number(g.saved) / Number(g.target)) * 100));
      return `<tr><td>${g.emoji} ${g.name}</td><td>${BRL(g.saved)} / ${BRL(g.target)}</td><td>${pct}%</td><td>${formatDateBR(g.deadline)}</td></tr>`;
    })
    .join("");
  w.document.write(`<html><head><title>FinançasPro — Relatório</title>${style}</head><body>
    <h1>FinançasPro — Relatório</h1>
    <div class="sub">Gerado em ${new Date().toLocaleString("pt-BR")} · ${user?.email || ""}</div>
    <div class="cards">
      <div class="card"><div class="lbl">Receitas</div><div class="val">${BRL(totals.income)}</div></div>
      <div class="card"><div class="lbl">Despesas</div><div class="val">${BRL(totals.expense)}</div></div>
      <div class="card"><div class="lbl">Saldo</div><div class="val">${BRL(totals.balance)}</div></div>
    </div>
    <h2>Metas</h2>
    <table><thead><tr><th>Meta</th><th>Progresso</th><th>%</th><th>Prazo</th></tr></thead><tbody>${goalRows || "<tr><td colspan='4'>Sem metas</td></tr>"}</tbody></table>
    <h2>Transações</h2>
    <table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>${rows || "<tr><td colspan='5'>Sem transações</td></tr>"}</tbody></table>
    <div class="footer">${transactions.length} transações · ${goals.length} metas</div>
  </body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 500);
}
