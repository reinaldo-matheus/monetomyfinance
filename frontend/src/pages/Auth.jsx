import { useState } from "react";
import { Eye, EyeOff, Zap, ArrowRight, Loader2, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatApiError } from "@/lib/api";

const AUTH_IMG = "https://images.unsplash.com/photo-1771875802948-0d0f3424fe6d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwyfHxkYXJrJTIwbmVvbiUyMHRlY2glMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3NzA1ODk5NXww&ixlib=rb-4.1.0&q=85";

export default function Auth() {
  const { login, register } = useAuth();
  const { show } = useToast();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return "E-mail inválido";
    if (password.length < 6) return "Senha deve ter no mínimo 6 caracteres";
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError(""); setLoading(true);
    try {
      if (mode === "login") { await login(email.trim(), password); show("ACESSO CONCEDIDO", "success"); }
      else { await register(email.trim(), password); show("CONTA INICIALIZADA", "success"); }
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Falha ao autenticar");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full bg-hud-bg text-hud-text">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left visual */}
        <div className="relative hidden overflow-hidden lg:block">
          <img src={AUTH_IMG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(5,5,5,0.55), rgba(5,5,5,0.92))" }} />
          <div className="absolute inset-0 bg-hud-grid opacity-50" />
          <div className="absolute inset-0 bg-scanlines opacity-30" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center border border-hud-cyan">
                <span className="hud-bracket tl" /><span className="hud-bracket tr" /><span className="hud-bracket bl" /><span className="hud-bracket br" />
                <Zap size={20} className="text-hud-cyan glow-cyan-text" />
              </div>
              <span className="font-display text-2xl font-bold tracking-[0.3em] glow-cyan-text">MONETO</span>
            </div>
            <div>
              <p className="label-hud">// Player.Profile — Sistema Financeiro</p>
              <h1 className="font-display mt-4 max-w-lg text-5xl font-black uppercase leading-[1.05] tracking-tight text-white">
                Domine suas <span className="text-hud-cyan glow-cyan-text">finanças</span> como uma <span className="text-hud-pink glow-pink-text">quest</span>.
              </h1>
              <p className="mt-5 max-w-md font-mono-hud text-xs leading-relaxed text-hud-muted">
                &gt; quests ativas · créditos em tempo real · alertas HUD · relatórios exportáveis
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono-hud text-[10px] uppercase tracking-widest text-hud-dim">
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 bg-hud-green" /> SYS_ONLINE</span>
              <span>·</span><span>v1.0</span><span>·</span><span>pt-BR</span>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="relative flex items-center justify-center p-6 sm:p-10">
          <div className="absolute inset-0 neon-radial pointer-events-none" />
          <div className="absolute inset-0 bg-hud-grid opacity-20 pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-hud-cyan" />
                <span className="font-display text-xl font-bold tracking-[0.25em] glow-cyan-text">MONETO</span>
              </div>
            </div>
            <p className="label-hud">// {mode === "login" ? "login.sequence" : "register.sequence"}</p>
            <h2 className="font-display mt-3 text-4xl font-bold uppercase tracking-tight md:text-5xl">
              {mode === "login" ? (<>Conecte-se <span className="text-hud-cyan glow-cyan-text">_</span></>) : (<>Comece a <span className="text-hud-pink glow-pink-text">jogar</span></>)}
            </h2>
            <p className="mt-3 font-mono-hud text-xs text-hud-muted">
              {mode === "login" ? "SEM CONTA? " : "JÁ ESTÁ JOGANDO? "}
              <button
                type="button"
                data-testid="toggle-auth-mode-btn"
                className="text-hud-cyan underline underline-offset-4 hover:text-white"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              >
                {mode === "login" ? "CRIAR CONTA" : "ENTRAR"}
              </button>
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <Field label="E-mail">
                <input
                  data-testid="auth-email-input"
                  type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@moneto.gg"
                  className={fieldCls}
                />
              </Field>
              <Field label="Senha">
                <div className="relative">
                  <input
                    data-testid="auth-password-input"
                    type={showPw ? "text" : "password"}
                    required minLength={6}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="mín. 6 caracteres"
                    className={fieldCls + " pr-10"}
                  />
                  <button
                    type="button"
                    data-testid="toggle-password-visibility-btn"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-hud-dim hover:text-hud-cyan"
                    aria-label="Mostrar/ocultar senha"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>

              {error && (
                <div data-testid="auth-error" className="flex items-center gap-2 border border-hud-pink/50 bg-hud-pink/10 px-3 py-2 font-mono-hud text-xs text-hud-pink">
                  <Terminal size={14} /> &gt; {error}
                </div>
              )}

              <button
                type="submit"
                data-testid={mode === "login" ? "login-submit-btn" : "signup-submit-btn"}
                disabled={loading}
                className="btn-hud group mt-2 flex w-full items-center justify-center gap-2 border border-hud-cyan bg-hud-cyan/10 px-6 py-3.5 text-sm text-hud-cyan transition-all hover:bg-hud-cyan hover:text-black hover:shadow-glow-cyan disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>
                  {mode === "login" ? "INICIAR SESSÃO" : "CRIAR PERFIL"}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </>}
              </button>
            </form>

            <p className="mt-8 font-mono-hud text-[10px] uppercase tracking-[0.2em] text-hud-dim">
              &gt; seus dados ficam isolados por sessão · sessão persistente
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

const fieldCls =
  "w-full border border-hud-border bg-hud-bg px-4 py-3 font-mono-hud text-sm text-hud-text outline-none transition-all placeholder:text-hud-dim focus:border-hud-cyan focus:shadow-glow-cyan";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label-hud mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
