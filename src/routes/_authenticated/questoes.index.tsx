import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, FileQuestion, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/questoes/")({
  head: () => ({
    meta: [
      { title: "Banco de Questões — Calourus" },
      { name: "description", content: "Pratique com questões organizadas por tópicos." },
    ],
  }),
  component: QuestionTopics,
});

type Topic = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  question_count: number;
};

type Usage = { answered_today: number; remaining: number; is_premium: boolean };

function QuestionTopics() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: topicsData }, { data: usageData }] = await Promise.all([
        supabase.rpc("list_question_topics"),
        supabase.rpc("get_daily_question_usage"),
      ]);
      if (topicsData) setTopics(topicsData);
      if (usageData && usageData.length > 0) setUsage(usageData[0]);
      setLoading(false);
    })();
  }, []);

  const outOfQuestions = usage && !usage.is_premium && usage.remaining <= 0;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-marinho hover:text-laranja">
            <ArrowLeft className="h-4 w-4" /> Voltar ao painel
          </Link>
          <span className="font-display font-bold text-marinho">Banco de Questões</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-marinho to-marinho-soft p-10 text-primary-foreground shadow-[var(--shadow-elegant)]">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest">
            <FileQuestion className="h-3.5 w-3.5" /> Pratique por tópicos
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Escolha um tópico</h1>
          <p className="mt-2 max-w-lg text-white/80">
            Questões de múltipla escolha e dissertativas elaboradas pela equipe Calourus.
          </p>
        </div>

        {usage && (
          <div
            className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
              usage.is_premium
                ? "border-laranja/30 bg-laranja-soft/40"
                : outOfQuestions
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border bg-card"
            }`}
          >
            <p className="text-sm text-marinho">
              {usage.is_premium ? (
                <>
                  <span className="font-semibold">Plano Premium</span> · questões ilimitadas hoje.
                </>
              ) : outOfQuestions ? (
                <>
                  Você respondeu suas <span className="font-semibold">5 questões grátis de hoje</span>. Volte amanhã
                  ou assine o Premium para continuar agora.
                </>
              ) : (
                <>
                  Plano grátis: <span className="font-semibold">{usage.remaining} de 5</span> questões restantes hoje.
                </>
              )}
            </p>
            {!usage.is_premium && (
              <button
                onClick={() => navigate({ to: "/checkout" })}
                className="inline-flex items-center gap-2 rounded-full bg-laranja px-4 py-2 text-xs font-semibold text-marinho shadow-[var(--shadow-glow)] transition hover:brightness-105"
              >
                <Sparkles className="h-3.5 w-3.5" /> Assinar Premium
              </button>
            )}
          </div>
        )}

        <section className="mt-8">
          {loading ? (
            <p className="text-muted-foreground">Carregando tópicos…</p>
          ) : topics.length === 0 ? (
            <p className="text-muted-foreground">Nenhum tópico disponível ainda.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((t) => (
                <Link
                  key={t.id}
                  to="/questoes/$topicSlug"
                  params={{ topicSlug: t.slug }}
                  className="group rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-laranja hover:shadow-[var(--shadow-elegant)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-marinho font-display font-bold text-primary-foreground">
                      C
                    </span>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-marinho">
                      {t.question_count} {t.question_count === 1 ? "questão" : "questões"}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold text-marinho">{t.title}</h3>
                  {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-laranja">
                    Praticar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
