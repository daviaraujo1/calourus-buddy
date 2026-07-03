import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Flame, Trophy, Target, BookOpenCheck, Sparkles, Medal, Crown, User as UserIcon, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Calourus" },
      { name: "description", content: "Acompanhe seu XP, nível e conquistas na plataforma." },
    ],
  }),
  component: Perfil,
});

type Stats = {
  xp: number;
  level: number;
  cards_studied: number;
  correct_count: number;
  streak_days: number;
  last_study_date: string | null;
};

type Profile = { full_name: string | null; course: string | null; university: string | null; avatar_url: string | null; plan: string };

const XP_PER_LEVEL = 100;

function Perfil() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");

      const [{ data: p }, { data: s }, { data: board }, { data: adminFlag }] = await Promise.all([
        supabase.from("profiles").select("full_name, course, university, avatar_url, plan").eq("id", user.id).maybeSingle(),
        supabase.from("user_stats").select("xp, level, cards_studied, correct_count, streak_days, last_study_date").eq("user_id", user.id).maybeSingle(),
        supabase.rpc("get_leaderboard", { _limit: 200 }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      setProfile(p);
      setStats(s ?? { xp: 0, level: 1, cards_studied: 0, correct_count: 0, streak_days: 0, last_study_date: null });
      setIsAdmin(!!adminFlag);
      if (Array.isArray(board)) {
        const idx = board.findIndex((r: { user_id: string }) => r.user_id === user.id);
        setRank(idx >= 0 ? idx + 1 : null);
      }
      setLoading(false);
    })();
  }, []);

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const xpIntoLevel = xp - (level - 1) * XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpIntoLevel;
  const progress = Math.min(100, (xpIntoLevel / XP_PER_LEVEL) * 100);
  const accuracy = stats && stats.cards_studied > 0
    ? Math.round((stats.correct_count / stats.cards_studied) * 100)
    : 0;
  const displayName = profile?.full_name || email.split("@")[0] || "Estudante";

  const badges = [
    { key: "first", label: "Primeiro cartão", desc: "Estudou 1 flashcard", earned: (stats?.cards_studied ?? 0) >= 1 },
    { key: "ten", label: "Dedicado", desc: "10 flashcards estudados", earned: (stats?.cards_studied ?? 0) >= 10 },
    { key: "fifty", label: "Focado", desc: "50 flashcards estudados", earned: (stats?.cards_studied ?? 0) >= 50 },
    { key: "streak3", label: "Em chamas", desc: "3 dias seguidos", earned: (stats?.streak_days ?? 0) >= 3 },
    { key: "streak7", label: "Semana perfeita", desc: "7 dias seguidos", earned: (stats?.streak_days ?? 0) >= 7 },
    { key: "lvl5", label: "Veterano", desc: "Nível 5", earned: level >= 5 },
    { key: "lvl10", label: "Mestre", desc: "Nível 10", earned: level >= 10 },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-marinho hover:text-laranja">
            <ArrowLeft className="h-4 w-4" /> Voltar ao painel
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && <AdminBadge />}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-widest ${
                profile?.plan === "premium"
                  ? "bg-laranja text-marinho"
                  : "border border-border bg-secondary text-marinho"
              }`}
              title={profile?.plan === "premium" ? "Plano Premium ativo" : "Plano gratuito"}
            >
              {profile?.plan === "premium" ? <Crown className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
              {profile?.plan === "premium" ? "Premium" : "Visitante"}
            </span>
            <Link to="/ranking" className="inline-flex items-center gap-2 rounded-full bg-laranja px-4 py-2 text-sm font-semibold text-primary-foreground">
              <Trophy className="h-4 w-4" /> Ver ranking
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : (
          <>
            {/* Hero */}
            <div className="rounded-3xl bg-gradient-to-br from-marinho to-marinho-soft p-8 text-primary-foreground shadow-[var(--shadow-elegant)]">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative">
                  <div className="grid h-24 w-24 place-items-center rounded-3xl bg-white/10 font-display text-4xl font-bold text-primary-foreground ring-4 ring-white/10">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="h-full w-full rounded-3xl object-cover" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-full bg-laranja font-display text-sm font-bold text-primary-foreground shadow-lg ring-4 ring-marinho">
                    {level}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest">
                      <Sparkles className="h-3.5 w-3.5" /> Nível {level}
                    </span>
                    <PlanBadge plan={profile?.plan} />
                    {isAdmin && <AdminBadge />}
                  </div>
                  <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{displayName}</h1>
                  <p className="text-sm text-white/70">
                    {profile?.course || profile?.university
                      ? `${profile.course ?? ""}${profile.course && profile.university ? " · " : ""}${profile.university ?? ""}`
                      : "Complete seu perfil no cadastro"}
                  </p>
                </div>
                {rank && (
                  <div className="rounded-2xl bg-white/10 px-5 py-4 text-center">
                    <Medal className="mx-auto h-6 w-6 text-laranja" />
                    <p className="mt-1 font-display text-2xl font-bold">#{rank}</p>
                    <p className="text-xs uppercase tracking-widest text-white/70">no ranking</p>
                  </div>
                )}
              </div>

              {/* XP bar */}
              <div className="mt-8">
                <div className="flex items-end justify-between text-sm">
                  <span className="font-semibold">{xp} XP total</span>
                  <span className="text-white/70">Faltam {xpToNext} XP para o nível {level + 1}</span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-laranja transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: BookOpenCheck, label: "Cartões estudados", value: stats?.cards_studied ?? 0 },
                { icon: Target, label: "Precisão", value: `${accuracy}%` },
                { icon: Flame, label: "Sequência", value: `${stats?.streak_days ?? 0} dias` },
                { icon: Trophy, label: "XP total", value: xp },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl bg-card p-6 ring-1 ring-border">
                  <Icon className="h-6 w-6 text-laranja" strokeWidth={1.75} />
                  <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-marinho">{value}</p>
                </div>
              ))}
            </section>

            {/* Badges */}
            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold text-marinho">Conquistas</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {badges.map((b) => (
                  <div
                    key={b.key}
                    className={`flex items-start gap-3 rounded-2xl p-4 ring-1 transition ${
                      b.earned ? "bg-card ring-laranja" : "bg-card/50 ring-border opacity-60"
                    }`}
                  >
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${b.earned ? "bg-laranja text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      <Medal className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-marinho">{b.label}</p>
                      <p className="text-sm text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function PlanBadge({ plan }: { plan?: string }) {
  const isPremium = plan === "premium";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
        isPremium ? "bg-laranja text-marinho" : "bg-white/10 text-white"
      }`}
      title={isPremium ? "Plano Premium ativo" : "Plano gratuito (visitante)"}
    >
      {isPremium ? <Crown className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
      {isPremium ? "Premium" : "Visitante"}
    </span>
  );
}

function AdminBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white shadow-sm ring-1 ring-red-700/40"
      title="Administrador do site"
    >
      <ShieldCheck className="h-3.5 w-3.5" /> Admin
    </span>
  );
}


