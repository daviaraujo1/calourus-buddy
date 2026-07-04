import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Loader2, Scale, Apple, Cog, GraduationCap, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/curso")({
  head: () => ({
    meta: [
      { title: "Escolha seu curso — Calourus" },
      { name: "description", content: "Escolha seu curso para personalizar flashcards, questões e materiais." },
    ],
  }),
  component: CourseSelection,
});

type Course = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  icon: string;
  active: boolean;
};

const ICONS: Record<string, LucideIcon> = { Scale, Apple, Cog };

function CourseSelection() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: { user } }, { data: cs }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("courses").select("id, slug, name, tagline, icon, active").order("sort_order"),
      ]);
      setCourses(cs ?? []);
      if (user) {
        const { data: p } = await supabase.from("profiles").select("course_id").eq("id", user.id).maybeSingle();
        setCurrentCourseId(p?.course_id ?? null);
      }
      setLoading(false);
    })();
  }, []);

  async function selectCourse(course: Course) {
    if (!course.active) return;
    setSaving(course.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ course_id: course.id }).eq("id", user.id);
      if (error) throw error;
      toast.success(`Prontinho! A Calourus agora é personalizada para ${course.name}.`);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar seu curso.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-marinho hover:text-laranja">
            <ArrowLeft className="h-4 w-4" /> Voltar ao painel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-laranja-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-marinho">
            <GraduationCap className="h-3.5 w-3.5" /> Personalize sua experiência
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold text-marinho sm:text-5xl">Qual curso você faz?</h1>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            Flashcards, banco de questões e materiais vão se ajustar ao seu curso.
          </p>
        </div>

        {loading ? (
          <p className="mt-10 text-center text-muted-foreground">Carregando…</p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {courses.map((course) => {
              const Icon = ICONS[course.icon] ?? GraduationCap;
              const isCurrent = currentCourseId === course.id;
              return (
                <button
                  key={course.id}
                  onClick={() => selectCourse(course)}
                  disabled={!course.active || saving === course.id}
                  className={`relative flex flex-col items-center rounded-2xl border-2 p-8 text-center transition ${
                    !course.active
                      ? "cursor-not-allowed border-border bg-card opacity-60"
                      : isCurrent
                        ? "border-laranja bg-laranja-soft shadow-[var(--shadow-elegant)]"
                        : "border-border bg-card hover:border-laranja/50 hover:shadow-[var(--shadow-elegant)]"
                  }`}
                >
                  {!course.active && (
                    <span className="absolute -top-3 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border">
                      Em breve
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 inline-flex items-center gap-1 rounded-full bg-laranja px-3 py-1 text-xs font-semibold text-marinho">
                      <Check className="h-3 w-3" /> Selecionado
                    </span>
                  )}
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-marinho text-primary-foreground">
                    {saving === course.id ? <Loader2 className="h-7 w-7 animate-spin" /> : <Icon className="h-8 w-8" />}
                  </div>
                  <h2 className="mt-4 font-display text-xl font-bold text-marinho">{course.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{course.tagline}</p>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
