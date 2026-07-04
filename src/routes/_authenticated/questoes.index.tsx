import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, FileQuestion, Search, Sparkles, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/questoes/")({
  head: () => ({
    meta: [
      { title: "Banco de Questões — Calourus" },
      { name: "description", content: "Pratique com questões organizadas por disciplina." },
    ],
  }),
  component: QuestionSearch,
});

type Topic = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  area_id: string | null;
  area_name: string | null;
  question_count: number;
};

type Area = { id: string; name: string; sort_order: number };
type Usage = { answered_today: number; remaining: number; is_premium: boolean };

const ALL_AREAS = "__all__";

function QuestionSearch() {
  const navigate = useNavigate();
  const [hasCourse, setHasCourse] = useState<boolean | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string>(ALL_AREAS);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("course_id").eq("id", user.id).maybeSingle();
      setHasCourse(!!profile?.course_id);

      const [{ data: areasData }, { data: usageData }] = await Promise.all([
        supabase.rpc("list_my_subject_areas"),
        supabase.rpc("get_daily_question_usage"),
      ]);
      setAreas(areasData ?? []);
      if (usageData && usageData.length > 0) setUsage(usageData[0]);
      await fetchTopics(null, "");
      setLoading(false);
    })();
  }, []);

  async function fetchTopics(areaId: string | null, query: string) {
    const { data } = await supabase.rpc("list_question_topics", {
      _area_id: areaId ?? undefined,
      _search: query || undefined,
    });
    setTopics(data ?? []);
  }

  async function handleSearch() {
    setLoading(true);
    setAppliedSearch(search);
    await fetchTopics(selectedArea === ALL_AREAS ? null : selectedArea, search);
    setLoading(false);
  }

  async function handleAreaChange(value: string) {
    setSelectedArea(value);
    setLoading(true);
    await fetchTopics(value === ALL_AREAS ? null : value, appliedSearch);
    setLoading(false);
  }

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

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-marinho">Buscar questões</h1>
        <p className="mt-1 text-muted-foreground">Pratique com questões organizadas pela sua disciplina.</p>

        {hasCourse === false && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-laranja bg-laranja-soft p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-marinho">
              <GraduationCap className="h-4 w-4" /> Escolha seu curso para ver as disciplinas certas para você.
            </p>
            <button
              onClick={() => navigate({ to: "/curso" })}
              className="rounded-full bg-marinho px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Escolher curso
            </button>
          </div>
        )}

        {/* Search card, styled after the reference screenshot */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="sm:w-64">
              <Select value={selectedArea} onValueChange={handleAreaChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_AREAS}>Todas as disciplinas</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Digite um trecho do tópico"
                className="pl-9"
              />
            </div>
            <button
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-laranja px-6 py-2 text-sm font-semibold text-marinho shadow-[var(--shadow-glow)] transition hover:brightness-105"
            >
              <Search className="h-4 w-4" /> Buscar questões
            </button>
          </div>
        </div>

        {usage && (
          <div
            className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
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
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <FileQuestion className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 text-muted-foreground">
                {appliedSearch || selectedArea !== ALL_AREAS
                  ? "Nenhum tópico encontrado para esse filtro."
                  : "Nenhum tópico disponível ainda."}
              </p>
            </div>
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
                  {t.area_name && (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-laranja">{t.area_name}</p>
                  )}
                  <h3 className="mt-1 font-display text-lg font-bold text-marinho">{t.title}</h3>
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
