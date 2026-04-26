# ⚡ MONETO — Command Center Financeiro

> **"Domine suas finanças como uma Quest."**

![Status](https://img.shields.io/badge/status-live-00ff88?style=for-the-badge)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Supabase-00e5ff?style=for-the-badge)
![Deploy](https://img.shields.io/badge/deploy-Vercel-ffffff?style=for-the-badge)

---

## 🎮 O que é o MONETO?

**MONETO** é uma plataforma de controle financeiro pessoal com identidade visual gamer/cyberpunk, construída do zero com React, Supabase e Recharts.

A proposta é simples: transformar a gestão financeira, que normalmente é chata e intimidadora, em algo com a energia de um jogo. Cada receita é um **LOOT**. Cada despesa é um **BURN**. Cada meta financeira é uma **QUEST**.

---

## ✨ Funcionalidades

### 🔐 Autenticação
- Cadastro e login com email/senha via **Supabase Auth**
- Sessão persistida entre recarregamentos
- Isolamento total de dados por usuário (**Row Level Security**)

### 💹 Control Center (Dashboard)
- Cards em tempo real: **LOOT** (entradas), **BURN** (saídas), **CRÉDITOS** (saldo)
- Sistema de alertas **HUD-WARN** automático para metas próximas do prazo
- Indicador de sincronização com o banco de dados

### 📋 Quest Log (Transações)
- Registro de receitas e despesas com categoria, data e valor
- Filtros por tipo e por mês
- Deleção individual com sincronização ao Supabase

### 📊 Analytics
- **BarChart** mensal: Receitas vs Despesas (Recharts)
- **PieChart**: distribuição de despesas por categoria

### 🏆 Quests (Metas Financeiras)
- Criação de metas com emoji, valor objetivo e prazo
- Barra de progresso com gradiente dinâmico (azul → vermelho → verde)
- Sistema de depósito parcial (**+ Depositar XP**)
- Alerta automático quando o prazo está crítico (≤ 30 dias)
- Toast de **ACHIEVEMENT UNLOCKED** a cada ação relevante

### 📤 Exportação de Dados
- **CSV** com BOM UTF-8 (compatível com Excel BR), separador `;`
- **PDF** gerado via `window.print()` com layout profissional (zero dependências externas)

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Segurança | Row Level Security (RLS) |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Geração de app | Emergent |
| Deploy | Vercel |

---

## 🧠 Decisões técnicas relevantes

**`useState` com lazy initialization**
```js
// Executa loadData() apenas 1 vez na montagem — não a cada render
const [data, setData] = useState(() => loadData());
```

**`useCallback` + `useEffect` sem loop infinito**
```js
const fetchData = useCallback(async () => { ... }, [user.id]);
useEffect(() => { fetchData(); }, [fetchData]);
```

**`useMemo` para valores derivados**
```js
// Totais e alertas são recalculados APENAS quando transactions/goals mudam
const totalReceitas = useMemo(() =>
  transactions.filter(t => t.type === "receita")
    .reduce((s, t) => s + t.value, 0), [transactions]);
```

**Row Level Security no Supabase**
```sql
-- Cada usuário acessa APENAS seus próprios dados — no nível do banco
create policy "users_own_data" on public.transactions
  for all using (auth.uid() = user_id);
```

**Export CSV sem dependências**
```js
// BOM para Excel BR + Blob API + link programático
const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
```

---

## 🗄️ Modelagem do Banco

```
auth.users (Supabase)
    │
    ├── transactions
    │     ├── id (uuid, PK)
    │     ├── user_id (FK → auth.users)
    │     ├── type (receita | despesa)
    │     ├── description, value, category, date
    │     └── RLS ativo
    │
    └── goals
          ├── id (uuid, PK)
          ├── user_id (FK → auth.users)
          ├── name, emoji, target, saved, deadline
          └── RLS ativo
```

---

## 🚀 Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/moneto.git
cd moneto

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# Rode o projeto
npm run dev
```

### Variáveis de ambiente necessárias
```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

---

## 📸 Screenshots

| Tela de Login | Control Center | Quests |
|---|---|---|
| Identidade gamer, split layout | Cards LOOT / BURN / CRÉDITOS | Metas com XP e barra de progresso |

---

## 📈 Aprendizados do projeto

Este projeto foi construído como parte da minha jornada de evolução, focando em:

- Arquitetura de componentes com separação de responsabilidades
- Padrões avançados de React: `useMemo`, `useCallback`, lazy initialization
- Segurança de dados com RLS no banco de dados
- Integração com BaaS (Backend as a Service) via Supabase
- UX de feedback visual: toasts, indicadores de sync, alertas contextuais
- Exportação de dados client-side sem dependências externas
- Identidade visual consistente com design system próprio

---

## Autor 🪄

Desenvolvido por **Matheus Reinaldo**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-conectar-0077B5?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/matheus-reinaldo/)
[![GitHub](https://img.shields.io/badge/GitHub-ver%20código-181717?style=for-the-badge&logo=github)]([https://github.com/seu-usuario](https://github.com/reinaldo-matheus/monetomyfinance))
