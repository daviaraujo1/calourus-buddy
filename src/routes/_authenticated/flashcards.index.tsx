import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Layers } from "lucide-react";
import { PremiumGate } from "@/components/premium-gate";

export const Route = createFileRoute("/_authenticated/flashcards/")({
  head: () => ({
    meta: [
      { title: "Flashcards — Calourus" },
      { name: "description", content: "Estude com flashcards organizados por tópicos." },
    ],
  }),
  component: FlashcardTopics,
});

type Topic = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  area_id: string | null;
  subject_areas: { name: string } | null;
  card_count?: number;
};

function FlashcardTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let courseId: string | null = null;
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("course_id").eq("id", user.id).maybeSingle();
        courseId = profile?.course_id ?? null;
      }

      let query = supabase
        .from("flashcard_topics")
        .select("id, slug, title, description, area_id, subject_areas(name)")
        .order("sort_order", { ascending: true });

      query = courseId
        ? query.or(`course_id.is.null,course_id.eq.${courseId}`)
        : query.is("course_id", null);

      const { data: topicsData } = await query;

      if (topicsData) {
        const withCounts = await Promise.all(
          topicsData.map(async (t) => {
            const { count } = await supabase
              .from("flashcards")
              .select("*", { count: "exact", head: true })
              .eq("topic_id", t.id);
            return { ...t, card_count: count ?? 0 };
          }),
        );
        setTopics(withCounts);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <PremiumGate>
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-marinho hover:text-laranja">
            <ArrowLeft className="h-4 w-4" /> Voltar ao painel
          </Link>
          <span className="font-display font-bold text-marinho">Flashcards</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-marinho to-marinho-soft p-10 text-primary-foreground shadow-[var(--shadow-elegant)]">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest">
            <Layers className="h-3.5 w-3.5" /> Estudo por tópicos
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Escolha um tópico</h1>
          <p className="mt-2 max-w-lg text-white/80">
            Cartões elaborados pela equipe Calourus para fixar o conteúdo dos principais cursos.
          </p>
        </div>

        <section className="mt-10">
          {loading ? (
            <p className="text-muted-foreground">Carregando tópicos…</p>
          ) : topics.length === 0 ? (
            <p className="text-muted-foreground">Nenhum tópico disponível ainda.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((t) => (
                <Link
                  key={t.id}
                  to="/flashcards/$topicSlug"
                  params={{ topicSlug: t.slug }}
                  className="group rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-laranja hover:shadow-[var(--shadow-elegant)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-marinho font-display font-bold text-primary-foreground">C</span>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-marinho">
                      {t.card_count} {t.card_count === 1 ? "cartão" : "cartões"}
                    </span>
                  </div>
                  {t.subject_areas?.name && (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-laranja">{t.subject_areas.name}</p>
                  )}
                  <h3 className="mt-1 font-display text-xl font-bold text-marinho">{t.title}</h3>
                  {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-laranja">
                    Estudar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
    </PremiumGate>
  );
}
