export const BRL = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDateBR = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const daysUntil = (iso) => {
  if (!iso) return 0;
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

export const monthKey = (iso) => (iso ? iso.slice(0, 7) : "");

export const monthLabelBR = (key) => {
  const [y, m] = key.split("-").map(Number);
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${names[m - 1]}/${String(y).slice(2)}`;
};

export const INCOME_CATEGORIES = ["Salário", "Freelance", "Investimentos", "Outros"];
export const EXPENSE_CATEGORIES = ["Moradia", "Alimentação", "Transporte", "Saúde", "Lazer", "Educação", "Outros"];
export const GOAL_EMOJIS = ["🎯", "🏠", "✈️", "🚗", "📱", "🎓", "💍", "🛡️", "💻", "🌴"];

export const CATEGORY_COLORS = {
  "Moradia": "#D4FF00",
  "Alimentação": "#FF443A",
  "Transporte": "#3B82F6",
  "Saúde": "#A855F7",
  "Lazer": "#F59E0B",
  "Educação": "#10B981",
  "Outros": "#71717A",
};
