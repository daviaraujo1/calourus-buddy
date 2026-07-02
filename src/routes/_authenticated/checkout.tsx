import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, Sparkles, ArrowLeft, ExternalLink, Radar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildKiwifyCheckoutUrl } from "@/lib/kiwify";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Assinar Premium — Calourus" },
      { name: "description", content: "Finalize sua assinatura Premium e desbloqueie questões, flashcards e materiais ilimitados." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string>(buildKiwifyCheckoutUrl());
  const [waiting, setWaiting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // If the account is already premium, there's nothing to pay for.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("plan, full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.plan === "premium") {
        navigate({ to: "/flashcards", replace: true });
        return;
      }
      setCheckoutUrl(buildKiwifyCheckoutUrl({ name: data?.full_name, email: data?.email ?? user.email }));
      setChecking(false);
    })();
  }, [navigate]);

  async function checkPlan() {
    if (!userId) return;
    const { data } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
    if (data?.plan === "premium") {
      stopWaiting();
      toast.success("Pagamento confirmado! Premium liberado.");
      navigate({ to: "/flashcards", replace: true });
    }
  }

  function startWaiting() {
    setWaiting(true);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(checkPlan, 4000);
    window.addEventListener("focus", checkPlan);
  }

  function stopWaiting() {
    setWaiting(false);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    window.removeEventListener("focus", checkPlan);
  }

  useEffect(() => () => stopWaiting(), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/40">
        <Loader2 className="h-6 w-6 animate-spin text-marinho" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
        <Link to="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-marinho hover:underline">
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div className="rounded-2xl border-2 border-laranja bg-card p-8 shadow-[var(--shadow-elegant)]">
            <span className="inline-flex items-center gap-2 rounded-full bg-laranja-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-marinho">
              <Sparkles className="h-3.5 w-3.5" /> Plano Premium
            </span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-marinho">R$ 39,99</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            <ul className="mt-6 grid gap-2.5 text-sm text-marinho">
              <li>✓ Questões ilimitadas no banco de questões</li>
              <li>✓ Flashcards ilimitados</li>
              <li>✓ Materiais guia ilimitados</li>
              <li>✓ Videoaulas completas e mentorias</li>
            </ul>
            <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              Cancele quando quiser. A cobrança é mensal e recorrente.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
            <h1 className="font-display text-2xl font-bold text-marinho">Finalizar assinatura</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              O pagamento é processado pela Kiwify, nosso parceiro de checkout.
            </p>

            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={startWaiting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-laranja px-4 py-3 text-sm font-semibold text-marinho shadow-[var(--shadow-glow)] transition hover:brightness-105"
            >
              <ExternalLink className="h-4 w-4" />
              Comprar agora · R$ 39,99
            </a>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Abre em uma nova aba — esta página continua aberta aqui.
            </p>

            {waiting && (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-laranja/40 bg-laranja-soft/50 p-4">
                <Radar className="h-5 w-5 shrink-0 animate-pulse text-laranja" />
                <p className="text-sm text-marinho">
                  Aguardando a confirmação do pagamento… assim que a Kiwify aprovar, seu acesso
                  Premium é liberado automaticamente e você é enviado para os flashcards.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
