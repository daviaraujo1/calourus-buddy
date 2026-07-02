import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ArrowRight, Loader2, Mail, Lock, User, Sparkles } from "lucide-react";
import { toast } from "sonner";

const authSearchSchema = z.object({
  plan: z.enum(["free", "premium"]).catch("free"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({
    meta: [
      { title: "Entrar — Calourus" },
      { name: "description", content: "Acesse sua conta Calourus ou crie uma nova para destravar materiais, videoaulas e monitores." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { plan } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function destinationAfterAuth() {
    if (plan !== "premium") return { to: "/dashboard" as const };
    const { data } = await supabase.auth.getUser();
    if (!data.user) return { to: "/dashboard" as const };
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile?.plan === "premium") return { to: "/dashboard" as const };
    return { to: "/checkout" as const };
  }

  // Already-signed-in users skip straight to where they were headed
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const dest = await destinationAfterAuth();
      navigate({ ...dest, replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Redirecionando…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      }
      const dest = await destinationAfterAuth();
      navigate({ ...dest, replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/auth" + (plan === "premium" ? "?plan=premium" : ""),
      });
      if (result.error) {
        toast.error(result.error.message ?? "Não foi possível entrar");
        return;
      }
      if (result.redirected) return;
      // Tokens already set
      const dest = await destinationAfterAuth();
      navigate({ ...dest, replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no login social";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-marinho text-primary-foreground font-display font-bold">
            C
          </span>
          <span className="font-display text-xl font-bold text-marinho">Calourus</span>
        </Link>

        {plan === "premium" && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-laranja/40 bg-laranja-soft px-4 py-3 text-sm text-marinho">
            <Sparkles className="h-4 w-4 shrink-0 text-laranja" />
            <span>
              Você escolheu o <strong>plano Premium (R$ 39,99/mês)</strong>. Após entrar, você
              finaliza o pagamento e libera o acesso completo.
            </span>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
          <h1 className="font-display text-2xl font-bold text-marinho">
            {mode === "signin" ? "Entrar na sua conta" : "Criar conta gratuita"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Acesse materiais, videoaulas e monitores."
              : "Comece sua jornada universitária com vantagem."}
          </p>

          <div className="mt-6 grid gap-2">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="inline-flex items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-marinho transition hover:bg-secondary disabled:opacity-50"
            >
              <GoogleIcon className="h-4 w-4" /> Continuar com Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("apple")}
              disabled={loading}
              className="inline-flex items-center justify-center gap-3 rounded-lg border border-border bg-marinho px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-marinho-soft disabled:opacity-50"
            >
              <AppleIcon className="h-4 w-4" /> Continuar com Apple
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou com email <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="grid gap-3">
            {mode === "signup" && (
              <Field icon={User} placeholder="Nome completo" value={fullName} onChange={setFullName} required />
            )}
            <Field icon={Mail} placeholder="seu@email.com" type="email" value={email} onChange={setEmail} required />
            <Field icon={Lock} placeholder="Senha" type="password" value={password} onChange={setPassword} required minLength={6} />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-laranja px-4 py-2.5 text-sm font-semibold text-marinho shadow-[var(--shadow-glow)] transition hover:brightness-105 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-marinho hover:underline"
            >
              {mode === "signin" ? "Criar agora" : "Entrar"}
            </button>
          </p>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Não oferecemos login com Facebook no momento. Use Google, Apple ou email.
          </p>
        </div>

        <Link to="/" className="mt-6 text-center text-sm text-muted-foreground hover:text-marinho">
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  ...props
}: {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  const { onChange, ...rest } = props;
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 focus-within:border-laranja">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <input
        {...rest}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-marinho outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.12A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 12.78c-.024-2.5 2.04-3.7 2.132-3.76-1.163-1.7-2.973-1.93-3.617-1.96-1.54-.155-3.005.91-3.79.91-.79 0-1.99-.89-3.27-.865-1.683.025-3.234.978-4.1 2.49-1.747 3.03-.447 7.51 1.252 9.97.83 1.21 1.817 2.563 3.115 2.515 1.252-.05 1.726-.81 3.236-.81 1.51 0 1.94.81 3.265.78 1.348-.024 2.2-1.232 3.022-2.45.954-1.4 1.348-2.76 1.372-2.83-.03-.013-2.63-1.012-2.656-4.01zM13.96 5.6c.69-.84 1.158-2.005 1.03-3.16-.994.04-2.2.663-2.916 1.502-.64.745-1.2 1.937-1.05 3.07 1.11.085 2.246-.566 2.936-1.412z" />
    </svg>
  );
}
