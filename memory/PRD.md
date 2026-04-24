# PRD — FinançasPro

## Problema Original
Usuário forneceu prompt detalhado para FinançasPro: app web de controle financeiro pessoal em pt-BR com autenticação, transações, metas financeiras, gráficos, alertas automáticos e exportações (CSV/PDF). Originalmente especificado para Supabase+Vite — adaptado para stack nativa Emergent (React CRA + FastAPI + MongoDB) com auth JWT customizada, conforme escolha do usuário.

## Stack & Arquitetura
- **Frontend**: React 19 (CRA) · Tailwind · Recharts · Lucide · Framer Motion · react-countup
- **Backend**: FastAPI · Motor (async MongoDB) · PyJWT · bcrypt
- **Auth**: JWT em cookies httpOnly (access_token 1d + refresh_token 7d), SameSite=None+Secure
- **DB**: MongoDB com índices (users.email unique, transactions user_id+date, goals user_id)

## Personas
- **Usuário individual**: pessoa física querendo visão clara de receitas, despesas, saldo e metas
- **Admin** (opcional): gestor dos dados (admin@financaspro.com seed)

## Core Requirements (estáticos)
1. Auth (login/signup email+senha, logout, sessão persistente)
2. Dashboard com 3 cards de resumo + alertas automáticos
3. Lista de transações com filtros (tipo + mês), badges de tipo/categoria, delete
4. Gráficos: BarChart mensal receitas×despesas + PieChart por categoria
5. Metas com progresso animado, modal depósito, prazo + emoji
6. Modais de criação (transação, meta, depósito)
7. Exportação CSV (BOM + `;` + totais) e PDF (window.print)
8. Row-level security (cada user vê só seus dados)

## Implementado ✅ — 24/04/2026
- [x] Auth completo (register/login/me/logout/refresh) com cookies httpOnly
- [x] Brute-force protection (5 tentativas → 15min lockout)
- [x] Admin seed automático
- [x] CRUD de transações (scope por user_id)
- [x] CRUD de metas + endpoint de depósito
- [x] Dashboard com cards animados (CountUp), alertas condicionais
- [x] Abas Lista / Gráficos / Metas com transição
- [x] Gráficos Recharts (Bar + Pie) com tooltip dark customizado
- [x] Filtros por tipo e por mês
- [x] Skeleton loading, responsividade mobile
- [x] CSV (BRL/BOM) + PDF (window.print) exports
- [x] Toast + indicador de sincronização
- [x] Design "Swiss Luxury Fintech" (Instrument Serif + Plus Jakarta Sans, acid green #D4FF00 sobre #050505)
- [x] 100% data-testid nos elementos interativos
- [x] Testes backend: 15/15 pytest passaram (RLS, brute-force, validações, CRUD)

## Backlog (P1)
- Edição de transações existentes
- Categorias customizáveis pelo usuário
- Orçamentos mensais por categoria
- Notificações de metas próximas do prazo via e-mail
- Modo recorrência (salário mensal automático)

## Backlog (P2)
- Import de extrato bancário (CSV/OFX)
- Tags personalizadas em transações
- Dashboard de investimentos
- Dark/Light toggle

## Credenciais
- Admin: admin@financaspro.com / admin123
