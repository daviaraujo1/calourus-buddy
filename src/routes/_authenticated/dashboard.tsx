import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Layers, FileQuestion, UserCheck, LogOut, Sparkles, ArrowRight, Trophy, User, Flame } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel do Estudante — Calourus" },
      { name: "description", content: "Sua área pessoal no Calourus: materiais, videoaulas, banco de questões e monitores." },
    ],
  }),
  component: Dashboard,
});

type Profile = {
  full_name: string | null;
  course: string | null;
  university: string | null;
};

type Stats = {
  xp: number;
  level: number;
  streak_days: number;
};

const XP_PER_LEVEL = 100;

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("full_name, course, university").eq("id", user.id).maybeSingle(),
        supabase.from("user_stats").select("xp, level, streak_days").eq("user_id", user.id).maybeSingle(),
      ]);
      setProfile(p);
      setStats(s ?? { xp: 0, level: 1, streak_days: 0 });
    })();
  }, []);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Até logo!");
    navigate({ to: "/auth", replace: true });
  }

  const displayName = profile?.full_name || email.split("@")[0] || "estudante";

  const cards = [
    { icon: User, title: "Meu perfil", desc: "XP, nível e conquistas.", to: "/perfil" as const },
    { icon: Trophy, title: "Ranking", desc: "Compare-se com outros alunos.", to: "/ranking" as const },
    { icon: Layers, title: "Flashcards", desc: "Estude e ganhe XP.", to: "/flashcards" as const },
    { icon: BookOpen, title: "Materiais guia", desc: "Resumos por ementa e período.", to: undefined },
    { icon: FileQuestion, title: "Banco de questões", desc: "Milhares de exercícios resolvidos.", to: undefined },
    { icon: UserCheck, title: "Monitores", desc: "Tire dúvidas em tempo real (em breve).", to: undefined },
  ];

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const xpIntoLevel = xp - (level - 1) * XP_PER_LEVEL;
  const progress = Math.min(100, (xpIntoLevel / XP_PER_LEVEL) * 100);

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-marinho font-display font-bold text-primary-foreground">C</span>
            <span className="font-display text-lg font-bold text-marinho">Calourus</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/perfil"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-marinho hover:bg-secondary"
            >
              <User className="h-4 w-4" /> Perfil
            </Link>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-marinho hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-marinho to-marinho-soft p-10 text-primary-foreground shadow-[var(--shadow-elegant)]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5" /> Painel do estudante
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
                Olá, <span className="text-laranja">{displayName}</span>!
              </h1>
              <p className="mt-2 max-w-lg text-white/80">
                {profile?.course || profile?.university
                  ? `${profile.course ?? ""}${profile.course && profile.university ? " · " : ""}${profile.university ?? ""}`
                  : "Complete seu perfil para receber conteúdos personalizados do seu curso."}
              </p>
            </div>
            <Link
              to="/perfil"
              className="block rounded-2xl bg-white/10 p-5 backdrop-blur transition hover:bg-white/15 lg:min-w-[280px]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-laranja font-display text-lg font-bold text-primary-foreground">
                    {level}
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/70">Nível</p>
                    <p className="font-display text-lg font-bold">{xp} XP</p>
                  </div>
                </div>
                {(stats?.streak_days ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-laranja/20 px-3 py-1 text-sm font-semibold">
                    <Flame className="h-4 w-4 text-laranja" /> {stats?.streak_days}d
                  </span>
                )}
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-laranja transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/70">{XP_PER_LEVEL - xpIntoLevel} XP para o próximo nível</p>
            </Link>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold text-marinho">Acesso rápido</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(({ icon: Icon, title, desc, to }) => {
              const inner = (
                <>
                  <Icon className="h-7 w-7 text-laranja" strokeWidth={1.75} />
                  <h3 className="mt-4 font-display text-lg font-bold text-marinho">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  {to && (
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-laranja">
                      Acessar <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </>
              );
              return to ? (
                <Link
                  key={title}
                  to={to}
                  className="group rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-laranja hover:shadow-[var(--shadow-elegant)]"
                >
                  {inner}
                </Link>
              ) : (
                <div key={title} className="rounded-2xl bg-card p-6 ring-1 ring-border opacity-90">
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
