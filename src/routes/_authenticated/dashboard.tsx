import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Layers, FileQuestion, UserCheck, LogOut, Sparkles, ArrowRight } from "lucide-react";
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

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("full_name, course, university")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(data);
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
    { icon: BookOpen, title: "Materiais guia", desc: "Resumos por ementa e período.", to: undefined },
    { icon: Layers, title: "Flashcards", desc: "Estude com cartões por tópico.", to: "/flashcards" as const },
    { icon: FileQuestion, title: "Banco de questões", desc: "Milhares de exercícios resolvidos.", to: undefined },
    { icon: UserCheck, title: "Monitores", desc: "Tire dúvidas em tempo real (em breve).", to: undefined },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-marinho font-display font-bold text-primary-foreground">C</span>
            <span className="font-display text-lg font-bold text-marinho">Calourus</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-marinho hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-marinho to-marinho-soft p-10 text-primary-foreground shadow-[var(--shadow-elegant)]">
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

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold text-marinho">Acesso rápido</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-laranja">
                <Icon className="h-7 w-7 text-laranja" strokeWidth={1.75} />
                <h3 className="mt-4 font-display text-lg font-bold text-marinho">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
