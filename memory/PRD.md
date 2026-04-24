# PRD — Moneto (antigo FinançasPro)

## Problema Original
"Desenvolva essa aplicação" — app web de controle financeiro pessoal em pt-BR. Em iterações posteriores: renomear para **Moneto** e aplicar pegada **gamer/cyberpunk**.

## Stack & Arquitetura
- **Frontend**: React 19 (CRA) · Tailwind · Recharts · Lucide · Framer Motion · react-countup
- **Backend**: FastAPI · Motor · PyJWT · bcrypt
- **Auth**: JWT híbrido — access_token retornado no body + armazenado em localStorage + cookies httpOnly de fallback. Bearer no Authorization header contorna limitações de CORS do ingress preview.
- **DB**: MongoDB — índices: users.email unique, transactions user_id+date, goals user_id

## Design System — "Gamer / Cyberpunk HUD"
- Fontes: **Orbitron** (display/números), **Rajdhani** (headings), **IBM Plex Sans** (body), **JetBrains Mono** (dados/labels HUD)
- Paleta: `#050505` bg · `#0C0C14` surface · `#00F0FF` ciano · `#FF0055` pink · `#B026FF` roxo · `#39FF14` verde · `#FFB800` amarelo
- Efeitos: scanlines, grid HUD, brackets de canto, glow neon nos botões, XP-bars gradiente
- Gamificação textual: *Control Center · Quest Log · Quests · Créditos (CR) · Loot · Burn · XP · ACHIEVEMENT UNLOCKED · SYSTEM FAILURE*

## Personas
- Usuário individual (player) que quer gerenciar receitas, despesas e metas com um dashboard divertido
- Admin (seed automático)

## Implementado ✅
- [x] Auth completo com JWT híbrido (cookies + Bearer)
- [x] Brute-force protection
- [x] Admin seed
- [x] CRUD de transações (user-scoped)
- [x] CRUD de metas + endpoint de depósito
- [x] Dashboard com cards HUD, CountUp, scanline, brackets
- [x] Alerts HUD (saldo negativo, quests urgentes)
- [x] Tabs Quest Log / Analytics / Quests
- [x] BarChart (LOOT × BURN) + PieChart neon
- [x] Filtros por tipo e mês
- [x] CSV + PDF export (branded Moneto)
- [x] Skeleton loading + mobile responsivo
- [x] Toast "ACHIEVEMENT UNLOCKED"/"SYSTEM FAILURE" em estilo terminal
- [x] Modais resetam estado ao abrir (UX)
- [x] 100% data-testid nos elementos interativos
- [x] Rebrand completo: FinançasPro → Moneto
- [x] Backend 15/15 testes pytest passaram

## Iterações
- 24/04/2026 — MVP FinançasPro (design Swiss Luxury Fintech, acento lime)
- 24/04/2026 — Rebrand para Moneto + redesign cyberpunk/gamer
- 24/04/2026 — Fix auth: JWT híbrido com Bearer token para contornar CORS do ingress

## Backlog (P1)
- Edição de transações existentes
- Recorrência (salário mensal automático)
- Orçamentos mensais por categoria com indicador XP
- Notificações de metas via email
- Níveis/XP global do usuário (total saved / streaks)

## Backlog (P2)
- Import de extrato OFX/CSV
- Tags/labels customizáveis
- Dashboard de investimentos (ativos)
- Dark/Light toggle (com variante "retrowave")

## Credenciais
- Admin: admin@financaspro.com / admin123 (mantido por compatibilidade do seed)
- Qualquer usuário pode registrar em /auth
