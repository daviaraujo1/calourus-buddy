import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/questoes/$topicSlug")({
  head: () => ({
    meta: [
      { title: "Praticar questões — Calourus" },
      { name: "description", content: "Pratique questões do tópico selecionado." },
    ],
  }),
  component: QuestionStudy,
});

type Topic = { id: string; title: string; slug: string };
type Question = {
  id: string;
  type: "multiple_choice" | "essay";
  prompt: string;
  options: string[] | null;
  sort_order: number;
};
type Result = { correct: boolean | null; correct_option: number | null; explanation: string | null };

function QuestionStudy() {
  const { topicSlug } = Route.useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [essayText, setEssayText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase
        .from("question_topics")
        .select("id, title, slug")
        .eq("slug", topicSlug)
        .maybeSingle();

      if (!t) {
        setLoading(false);
        return;
      }
      setTopic(t);

      const [{ data: q }, { data: usage }] = await Promise.all([
        supabase.rpc("list_topic_questions", { _topic_id: t.id }),
        supabase.rpc("get_daily_question_usage"),
      ]);

      setQuestions((q ?? []) as Question[]);
      if (usage && usage.length > 0) {
        setRemaining(usage[0].remaining);
        setIsPremium(usage[0].is_premium);
        setLimitReached(!usage[0].is_premium && usage[0].remaining <= 0);
      }
      setLoading(false);
    })();
  }, [topicSlug]);

  const current = questions[index];
  const currentResult = current ? results[current.id] : undefined;

  function goTo(i: number) {
    setIndex(i);
    setSelected(null);
    setEssayText("");
  }

  async function submitAnswer(answer: string) {
    if (!current || submitting || currentResult) return;
    if (!isPremium && remaining !== null && remaining <= 0) {
      setLimitReached(true);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("record_question_attempt", {
      _question_id: current.id,
      _answer: answer,
    });
    setSubmitting(false);

    if (error) {
      if (error.message.includes("Limite diário")) {
        setLimitReached(true);
        setRemaining(0);
        toast.error("Limite diário de questões atingido.");
      } else {
        toast.error("Não foi possível registrar sua resposta.");
      }
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return;

    setResults((r) => ({
      ...r,
      [current.id]: { correct: row.correct, correct_option: row.correct_option, explanation: row.explanation },
    }));

    if (!row.is_premium) {
      setRemaining(row.remaining_today);
      if (row.remaining_today <= 0) setLimitReached(true);
    }

    if (current.type === "multiple_choice") {
      toast.success(row.correct ? "Boa! Resposta correta." : "Não foi dessa vez — veja a explicação.");
    } else {
      toast.success("Resposta registrada!");
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link to="/questoes" className="inline-flex items-center gap-2 text-sm font-medium text-marinho hover:text-laranja">
            <ArrowLeft className="h-4 w-4" /> Tópicos
          </Link>
          <span className="font-display font-bold text-marinho">{topic?.title ?? "Banco de Questões"}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : !topic ? (
          <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-border">
            <p className="text-muted-foreground">Tópico não encontrado.</p>
            <button
              onClick={() => navigate({ to: "/questoes" })}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-laranja px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Voltar
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-border">
            <p className="text-muted-foreground">Ainda não há questões neste tópico.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between text-sm">
              <span className="font-medium text-marinho">
                Questão {index + 1} de {questions.length}
              </span>
              {!isPremium && remaining !== null && (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-marinho">
                  {remaining} de 5 restantes hoje
                </span>
              )}
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-laranja transition-all"
                style={{ width: `${((index + 1) / questions.length) * 100}%` }}
              />
            </div>

            {!currentResult && limitReached ? (
              <div className="mt-8 rounded-3xl border-2 border-laranja bg-card p-10 text-center shadow-[var(--shadow-elegant)]">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-laranja-soft text-marinho">
                  <Lock className="h-7 w-7" />
                </div>
                <h2 className="mt-5 font-display text-xl font-bold text-marinho">
                  Você chegou ao limite diário
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  O plano grátis permite 5 questões respondidas por dia. Assine o Premium para
                  praticar sem limites.
                </p>
                <button
                  onClick={() => navigate({ to: "/checkout" })}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-laranja px-6 py-3 text-sm font-semibold text-marinho shadow-[var(--shadow-glow)] transition hover:brightness-105"
                >
                  <Sparkles className="h-4 w-4" /> Assinar Premium
                </button>
              </div>
            ) : (
              <div className="mt-8 rounded-3xl bg-card p-8 shadow-[var(--shadow-elegant)] ring-1 ring-border">
                <p className="font-display text-lg font-semibold leading-relaxed text-marinho sm:text-xl">
                  {current.prompt}
                </p>

                {current.type === "multiple_choice" && current.options && (
                  <div className="mt-6 grid gap-2.5">
                    {current.options.map((opt, i) => {
                      const isSelected = selected === i;
                      const isCorrectOpt = currentResult && currentResult.correct_option === i;
                      const isWrongPick = currentResult && isSelected && !currentResult.correct;
                      return (
                        <button
                          key={i}
                          disabled={!!currentResult || submitting}
                          onClick={() => {
                            setSelected(i);
                            submitAnswer(String(i));
                          }}
                          className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                            currentResult
                              ? isCorrectOpt
                                ? "border-teal bg-teal/10 text-marinho"
                                : isWrongPick
                                  ? "border-destructive/60 bg-destructive/5 text-marinho"
                                  : "border-border text-muted-foreground"
                              : isSelected
                                ? "border-laranja bg-laranja-soft text-marinho"
                                : "border-border text-marinho hover:border-laranja/50 hover:bg-secondary"
                          } disabled:cursor-default`}
                        >
                          {opt}
                          {currentResult && isCorrectOpt && <Check className="h-4 w-4 shrink-0 text-teal" />}
                          {currentResult && isWrongPick && <X className="h-4 w-4 shrink-0 text-destructive" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {current.type === "essay" && (
                  <div className="mt-6">
                    <textarea
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      disabled={!!currentResult || submitting}
                      placeholder="Escreva sua resposta…"
                      rows={5}
                      className="w-full rounded-xl border-2 border-border bg-background p-4 text-sm text-marinho outline-none transition focus:border-laranja disabled:opacity-70"
                    />
                    {!currentResult && (
                      <button
                        onClick={() => submitAnswer(essayText)}
                        disabled={submitting || !essayText.trim()}
                        className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-laranja px-6 py-2.5 text-sm font-semibold text-marinho shadow-[var(--shadow-glow)] transition hover:brightness-105 disabled:opacity-50"
                      >
                        Enviar resposta
                      </button>
                    )}
                  </div>
                )}

                {currentResult && currentResult.explanation && (
                  <div className="mt-5 rounded-xl border border-border bg-secondary/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-laranja">
                      {current.type === "essay" ? "Resposta esperada" : "Explicação"}
                    </p>
                    <p className="mt-1.5 text-sm text-marinho">{currentResult.explanation}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                onClick={() => goTo(Math.max(index - 1, 0))}
                disabled={index === 0}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-marinho transition hover:bg-secondary disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <button
                onClick={() => goTo(Math.min(index + 1, questions.length - 1))}
                disabled={index === questions.length - 1}
                className="inline-flex items-center gap-2 rounded-full bg-laranja px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                Próxima <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
