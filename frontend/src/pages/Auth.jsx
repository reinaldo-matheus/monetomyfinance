import { useState } from "react";
import { Eye, EyeOff, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatApiError } from "@/lib/api";

const AUTH_IMG = "https://static.prod-images.emergentagent.com/jobs/c105a936-b88c-409d-8882-448ea5b7bcc6/images/efd1b17d36c2143330242e80c944e52b3f58508009c21b2ddd62708d26b1ae7b.png";

export default function Auth() {
  const { login, register } = useAuth();
  const { show } = useToast();
  const [mode, setMode] = useState("login"); // "login" | "signup"
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
      if (mode === "login") {
        await login(email.trim(), password);
        show("Bem-vindo de volta", "success");
      } else {
        await register(email.trim(), password);
        show("Conta criada com sucesso", "success");
      }
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Falha ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-brand-bg text-brand-text">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left visual */}
        <div className="relative hidden overflow-hidden lg:block">
          <img src={AUTH_IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(5,5,5,0.55), rgba(5,5,5,0.85))" }} />
          <div className="relative z-10 flex h-full flex-col justify-between p-12">
            <div className="flex items-center gap-2 text-lg">
              <TrendingUp size={22} color="#D4FF00" />
              <span className="font-serif-display text-3xl tracking-tight">FinançasPro</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-muted">Controle Financeiro Pessoal</p>
              <h1 className="font-serif-display mt-4 max-w-lg text-5xl leading-[1.05] tracking-tight text-white">
                Clareza sobre cada <em className="text-[#D4FF00] not-italic italic">centavo</em>.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-muted">
                Metas, gráficos, alertas e exportações — tudo num painel elegante e preciso.
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs text-brand-dim">
              <span>Pagamentos</span>
              <span>·</span>
              <span>Metas</span>
              <span>·</span>
              <span>Relatórios</span>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="relative flex items-center justify-center p-6 sm:p-10">
          <div className="absolute inset-0 radial-lime pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} color="#D4FF00" />
                <span className="font-serif-display text-2xl">FinançasPro</span>
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-dim">{mode === "login" ? "Entrar" : "Criar conta"}</p>
            <h2 className="font-serif-display mt-3 text-4xl tracking-tight md:text-5xl">
              {mode === "login" ? "Acesse seu painel." : "Comece grátis."}
            </h2>
            <p className="mt-3 text-sm text-brand-muted">
              {mode === "login" ? "Sem cadastro? " : "Já tem conta? "}
              <button
                type="button"
                data-testid="toggle-auth-mode-btn"
                className="text-[#D4FF00] underline underline-offset-4 hover:text-[#B3D600]"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              >
                {mode === "login" ? "Criar uma conta" : "Entrar"}
              </button>
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-brand-dim">E-mail</label>
                <input
                  data-testid="auth-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="w-full rounded-md border border-brand-border bg-brand-bg px-4 py-3 text-sm outline-none transition-colors placeholder:text-brand-dim focus:border-[#D4FF00] focus:ring-1 focus:ring-[#D4FF00]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-brand-dim">Senha</label>
                <div className="relative">
                  <input
                    data-testid="auth-password-input"
                    type={showPw ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="mínimo 6 caracteres"
                    className="w-full rounded-md border border-brand-border bg-brand-bg px-4 py-3 pr-10 text-sm outline-none transition-colors placeholder:text-brand-dim focus:border-[#D4FF00] focus:ring-1 focus:ring-[#D4FF00]"
                  />
                  <button
                    type="button"
                    data-testid="toggle-password-visibility-btn"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dim hover:text-brand-text"
                    aria-label="Mostrar/ocultar senha"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div data-testid="auth-error" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                data-testid={mode === "login" ? "login-submit-btn" : "signup-submit-btn"}
                disabled={loading}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4FF00] px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-[#B3D600] disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>
                  {mode === "login" ? "Entrar" : "Criar conta"}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>}
              </button>
            </form>

            <p className="mt-8 text-xs text-brand-dim">
              Ao continuar você aceita nossos termos. Seus dados são isolados por conta.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
