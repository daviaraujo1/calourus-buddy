import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Shuffle, X, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/flashcards/$topicSlug")({
  head: () => ({
    meta: [
      { title: "Estudar flashcards — Calourus" },
      { name: "description", content: "Pratique flashcards do tópico selecionado." },
    ],
  }),
  component: FlashcardStudy,
});

type Card = { id: string; question: string; answer: string };
type Topic = { id: string; title: string; slug: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function FlashcardStudy() {
  const { topicSlug } = Route.useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase
        .from("flashcard_topics")
        .select("id, title, slug")
        .eq("slug", topicSlug)
        .maybeSingle();

      if (!t) {
        setLoading(false);
        return;
      }
      setTopic(t);

      const { data: c } = await supabase
        .from("flashcards")
        .select("id, question, answer")
        .eq("topic_id", t.id)
        .order("sort_order", { ascending: true });

      setCards(c ?? []);
      setLoading(false);
    })();
  }, [topicSlug]);

  const current = cards[index];
  const alreadyAnswered = current ? !!answered[current.id] : false;

  function next() {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, cards.length - 1));
  }
  function prev() {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  }
  function restart() {
    setFlipped(false);
    setIndex(0);
    setAnswered({});
  }
  function shuffleCards() {
    setFlipped(false);
    setIndex(0);
    setAnswered({});
    setCards((c) => shuffle(c));
  }

  async function answer(correct: boolean) {
    if (!current || submitting || alreadyAnswered) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc("record_flashcard_attempt", {
      _flashcard_id: current.id,
      _correct: correct,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível registrar sua resposta");
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setAnswered((a) => ({ ...a, [current.id]: true }));
    if (row?.leveled_up) {
      toast.success(`🎉 Subiu para o nível ${row.new_level}! +${row.xp_gained} XP`);
    } else {
      toast.success(`${correct ? "Boa!" : "Vamos revisar"} +${row?.xp_gained ?? 0} XP`);
    }
    setTimeout(() => {
      if (index < cards.length - 1) {
        setFlipped(false);
        setIndex((i) => i + 1);
      }
    }, 700);
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/flashcards" className="inline-flex items-center gap-2 text-sm font-medium text-marinho hover:text-laranja">
            <ArrowLeft className="h-4 w-4" /> Tópicos
          </Link>
          <span className="font-display font-bold text-marinho">{topic?.title ?? "Flashcards"}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : !topic ? (
          <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-border">
            <p className="text-muted-foreground">Tópico não encontrado.</p>
            <button
              onClick={() => navigate({ to: "/flashcards" })}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-laranja px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Voltar
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-border">
            <p className="text-muted-foreground">Ainda não há flashcards neste tópico.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between text-sm">
              <span className="font-medium text-marinho">
                Cartão {index + 1} de {cards.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={shuffleCards}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-marinho hover:bg-secondary"
                >
                  <Shuffle className="h-3.5 w-3.5" /> Embaralhar
                </button>
                <button
                  onClick={restart}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-marinho hover:bg-secondary"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
                </button>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-laranja transition-all"
                style={{ width: `${((index + 1) / cards.length) * 100}%` }}
              />
            </div>

            <div
              className="mt-8 [perspective:1600px]"
              onClick={() => setFlipped((f) => !f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setFlipped((f) => !f);
                }
              }}
            >
              <div
                className={`relative aspect-[3/4] w-full max-w-md mx-auto transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer ${
                  flipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                {/* FRONT — navy question */}
                <div className="absolute inset-0 flex flex-col rounded-3xl bg-marinho p-8 text-primary-foreground shadow-[var(--shadow-elegant)] [backface-visibility:hidden] overflow-hidden">
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <span className="mb-6 grid h-14 w-14 place-items-center rounded-full bg-marinho-soft font-display text-2xl font-bold text-primary-foreground ring-2 ring-white/10">
                      C
                    </span>
                    <p className="font-display text-xl font-semibold leading-relaxed sm:text-2xl">
                      {current.question}
                    </p>
                  </div>
                  <div className="mt-4 h-1.5 w-full rounded-full bg-laranja" />
                  <p className="mt-3 text-center text-xs uppercase tracking-widest text-white/60">
                    Toque para virar
                  </p>
                </div>

                {/* BACK — white grid answer */}
                <div
                  className="absolute inset-0 flex flex-col rounded-3xl bg-white p-6 text-marinho shadow-[var(--shadow-elegant)] [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(15,45,90,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,45,90,0.08) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="flex flex-1 flex-col rounded-2xl border-2 border-marinho/90 bg-white/70 p-6 backdrop-blur-sm">
                    <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-laranja">
                      Resposta
                    </span>
                    <div className="flex flex-1 items-center justify-center">
                      <p className="text-center font-display text-lg font-medium leading-relaxed sm:text-xl">
                        {current.answer}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-center">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-marinho font-display font-bold text-primary-foreground">
                        C
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                onClick={prev}
                disabled={index === 0}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-marinho transition hover:bg-secondary disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <button
                onClick={() => setFlipped((f) => !f)}
                className="rounded-full bg-marinho px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-marinho-soft"
              >
                {flipped ? "Ver pergunta" : "Ver resposta"}
              </button>
              <button
                onClick={next}
                disabled={index === cards.length - 1}
                className="inline-flex items-center gap-2 rounded-full bg-laranja px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                Próximo <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
