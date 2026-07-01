import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trophy, Flame, Crown, Medal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — Calourus" },
      { name: "description", content: "Veja os alunos com mais XP na plataforma." },
    ],
  }),
  component: Ranking,
});

type Row = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  cards_studied: number;
  streak_days: number;
};

function Ranking() {
  const [rows, setRows] = useState<Row[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: { user } }, { data }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.rpc("get_leaderboard", { _limit: 100 }),
      ]);
      setMeId(user?.id ?? null);
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-marinho hover:text-laranja">
            <ArrowLeft className="h-4 w-4" /> Voltar ao painel
          </Link>
          <span className="font-display font-bold text-marinho">Ranking</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-marinho to-marinho-soft p-8 text-primary-foreground shadow-[var(--shadow-elegant)]">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest">
            <Trophy className="h-3.5 w-3.5" /> Competição
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Top 100 Calourus</h1>
          <p className="mt-1 text-sm text-white/70">Ganhe XP estudando flashcards e suba no ranking.</p>
        </div>

        {loading ? (
          <p className="mt-8 text-muted-foreground">Carregando ranking…</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-muted-foreground">Ninguém pontuou ainda. Seja o primeiro!</p>
        ) : (
          <>
            {/* Podium */}
            {podium.length > 0 && (
              <section className="mt-10 grid gap-4 sm:grid-cols-3">
                {podium.map((r, i) => {
                  const styles = [
                    { ring: "ring-yellow-400", bg: "bg-yellow-400", icon: <Crown className="h-5 w-5" />, label: "1º" },
                    { ring: "ring-gray-300", bg: "bg-gray-300", icon: <Medal className="h-5 w-5" />, label: "2º" },
                    { ring: "ring-amber-600", bg: "bg-amber-600", icon: <Medal className="h-5 w-5" />, label: "3º" },
                  ][i];
                  const isMe = r.user_id === meId;
                  return (
                    <div
                      key={r.user_id}
                      className={`rounded-2xl bg-card p-6 text-center ring-2 ${styles.ring} ${isMe ? "shadow-[var(--shadow-elegant)]" : ""}`}
                    >
                      <div className={`mx-auto grid h-10 w-10 place-items-center rounded-full text-white ${styles.bg}`}>
                        {styles.icon}
                      </div>
                      <div className="mx-auto mt-3 grid h-16 w-16 place-items-center rounded-2xl bg-marinho font-display text-2xl font-bold text-primary-foreground">
                        {r.avatar_url ? (
                          <img src={r.avatar_url} alt={r.display_name} className="h-full w-full rounded-2xl object-cover" />
                        ) : (
                          r.display_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <p className="mt-3 font-display font-bold text-marinho">{r.display_name}{isMe ? " (você)" : ""}</p>
                      <p className="text-xs text-muted-foreground">Nível {r.level}</p>
                      <p className="mt-2 font-display text-2xl font-bold text-laranja">{r.xp} XP</p>
                    </div>
                  );
                })}
              </section>
            )}

            {/* List */}
            {rest.length > 0 && (
              <section className="mt-8 overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                <ul className="divide-y divide-border">
                  {rest.map((r, i) => {
                    const pos = i + 4;
                    const isMe = r.user_id === meId;
                    return (
                      <li
                        key={r.user_id}
                        className={`flex items-center gap-4 px-5 py-4 ${isMe ? "bg-laranja/10" : ""}`}
                      >
                        <span className="w-8 text-center font-display font-bold text-muted-foreground">{pos}</span>
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-marinho font-display font-bold text-primary-foreground">
                          {r.avatar_url ? (
                            <img src={r.avatar_url} alt={r.display_name} className="h-full w-full rounded-xl object-cover" />
                          ) : (
                            r.display_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-marinho">
                            {r.display_name}{isMe && <span className="ml-1 text-xs font-semibold text-laranja">(você)</span>}
                          </p>
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            Nível {r.level}
                            {r.streak_days > 0 && (
                              <span className="inline-flex items-center gap-1">
                                · <Flame className="h-3 w-3 text-laranja" /> {r.streak_days}d
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="font-display font-bold text-laranja">{r.xp} XP</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
