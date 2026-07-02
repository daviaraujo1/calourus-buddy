import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function usePlan() {
  const [plan, setPlan] = useState<"free" | "premium" | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
      setPlan(data?.plan === "premium" ? "premium" : "free");
    })();
  }, []);

  return plan;
}

/** Wrap Premium-only page content with this — shows a paywall for free-plan users. */
export function PremiumGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const plan = usePlan();

  if (plan === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/30">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (plan === "free") {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/30 px-6">
        <div className="mx-auto max-w-md rounded-3xl border-2 border-laranja bg-card p-10 text-center shadow-[var(--shadow-elegant)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-laranja-soft text-marinho">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-marinho">
            Flashcards são exclusivos do Premium
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Assine por R$ 39,99/mês e desbloqueie flashcards, questões e materiais ilimitados.
          </p>
          <button
            onClick={() => navigate({ to: "/checkout" })}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-laranja px-6 py-3 text-sm font-semibold text-marinho shadow-[var(--shadow-glow)] transition hover:brightness-105"
          >
            <Sparkles className="h-4 w-4" /> Assinar Premium
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
