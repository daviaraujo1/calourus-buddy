import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Compass,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  FileQuestion,
  UserCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";
import heroImg from "@/assets/hero-students.jpg";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calourus — Sua jornada universitária começa aqui" },
      { name: "description", content: "Materiais guia, dicas de estudo, videoaulas, banco de questões e monitores para os principais cursos da sua universidade." },
      { property: "og:title", content: "Calourus — Bem-vindo à vida acadêmica" },
      { property: "og:description", content: "A plataforma que ajuda calouros a se organizar e dominar o primeiro semestre." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Pillars />
        <Features />
        <Stats />
        <Plans />
        <Testimonial />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function useAuthed() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);
  return authed;
}

function Nav() {
  const authed = useAuthed();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-marinho text-primary-foreground font-display font-bold">
            C
          </span>
          <span className="font-display text-lg font-bold text-marinho">Calourus</span>
        </Link>
        <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#como-funciona" className="hover:text-marinho">Como funciona</a>
          <a href="#cursos" className="hover:text-marinho">Cursos</a>
          <a href="#planos" className="hover:text-marinho">Planos</a>
        </nav>
        <div className="flex items-center gap-2">
          {authed ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-laranja px-4 py-2 text-sm font-semibold text-marinho shadow-[var(--shadow-glow)] transition hover:brightness-105"
            >
              <LayoutDashboard className="h-4 w-4" /> Meu painel
            </Link>
          ) : (
            <>
              <Link to="/auth" className="hidden text-sm font-medium text-marinho hover:underline sm:inline">
                Entrar
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-full bg-laranja px-4 py-2 text-sm font-semibold text-marinho shadow-[var(--shadow-glow)] transition hover:brightness-105"
              >
                Começar grátis <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,oklch(0.76_0.16_62),transparent_45%)]" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
        <div className="text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Para quem está começando
          </span>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
            Bem-vindo à{" "}
            <span className="text-laranja">vida acadêmica</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/80">
            O Calourus reúne tudo que você precisa para dominar o primeiro semestre:
            materiais guia, dicas de estudo, videoaulas, banco de questões e
            monitores dos principais cursos da sua universidade.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-laranja px-6 py-3 text-sm font-semibold text-marinho shadow-[var(--shadow-glow)] transition hover:brightness-105"
            >
              Criar conta gratuita <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#cursos"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explorar cursos
            </a>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/15 pt-6 text-white">
            {[
              ["85%", "menos evasão"],
              ["+120", "cursos guiados"],
              ["+2k", "monitores"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-3xl font-bold text-laranja">{n}</dt>
                <dd className="mt-1 text-xs text-white/70">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-laranja/30 blur-3xl" />
          <img
            src={heroImg}
            alt="Estudantes universitários estudando juntos"
            width={1600}
            height={1200}
            className="relative w-full rounded-[1.75rem] border border-white/20 object-cover shadow-[var(--shadow-elegant)]"
          />
          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-elegant)] sm:block">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-soft text-marinho">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Próxima monitoria</p>
                <p className="text-sm font-semibold text-marinho">Cálculo I · hoje 19h</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  const items = [
    { icon: Compass, title: "Guia Prático", desc: "Navegação intuitiva que reduz a ansiedade do primeiro semestre." },
    { icon: Users, title: "Comunidade", desc: "Conectando calouros, veteranos e grupos de estudo com segurança." },
    { icon: GraduationCap, title: "Excelência", desc: "Ferramentas de organização e resumos dos principais cursos." },
  ];
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-laranja">Nossa essência</p>
        <h2 className="mt-3 font-display text-4xl font-bold text-marinho sm:text-5xl">
          Pilares que sustentam sua jornada
        </h2>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, title, desc }) => (
          <article
            key={title}
            className="group rounded-2xl border border-border bg-card p-8 transition hover:-translate-y-1 hover:border-laranja hover:shadow-[var(--shadow-elegant)]"
          >
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-marinho text-primary-foreground transition group-hover:bg-laranja group-hover:text-marinho">
              <Icon className="h-7 w-7" />
            </div>
            <h3 className="mt-6 font-display text-xl font-bold text-marinho">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: BookOpen, title: "Materiais guia", desc: "Resumos curados por ementa, organizados por disciplina e período." },
    { icon: PlayCircle, title: "Videoaulas", desc: "Aulas curtas que destravam os tópicos mais difíceis do semestre." },
    { icon: FileQuestion, title: "Banco de questões", desc: "Milhares de exercícios resolvidos, filtráveis por curso e nível." },
    { icon: UserCheck, title: "Monitores", desc: "Veteranos verificados disponíveis para tirar dúvidas em tempo real." },
  ];
  return (
    <section id="cursos" className="border-y border-border bg-secondary/50">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-teal">O que você encontra</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-marinho sm:text-5xl">
              Tudo num só lugar, do 1º ao último dia
            </h2>
          </div>
          <Link to="/auth" className="text-sm font-semibold text-marinho hover:underline">
            Ver todos os recursos →
          </Link>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-laranja"
            >
              <Icon className="h-8 w-8 text-laranja" strokeWidth={1.75} />
              <h3 className="mt-5 font-display text-lg font-bold text-marinho">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div
        className="overflow-hidden rounded-3xl p-12 text-primary-foreground sm:p-16"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-laranja">Impacto real</p>
            <h2 className="mt-3 font-display text-5xl font-bold leading-tight sm:text-6xl">
              <span className="text-laranja">85%</span> menos evasão no 1º semestre.
            </h2>
          </div>
          <p className="text-lg text-white/80">
            Nossa interface amigável e guias personalizados aumentam a confiança do
            estudante recém-chegado, criando um sentimento de pertencimento imediato
            à universidade.
          </p>
        </div>
      </div>
    </section>
  );
}

function Plans() {
  const rows = [
    ["Explicação geral dos cursos", true, true],
    ["Guia \"Como Funciona\"", true, true],
    ["Banco de questões básico", true, true],
    ["Fóruns de discussão", "Leitura", "Interação total"],
    ["Videoaulas completas", false, true],
    ["Mentorias e grupos", false, true],
    ["Monitores 1:1", false, true],
  ] as const;

  return (
    <section id="planos" className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-laranja">Planos de acesso</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-marinho sm:text-5xl">
            Comece grátis. Avance quando quiser.
          </h2>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)]">
          <div className="grid grid-cols-3 border-b border-border bg-marinho text-primary-foreground">
            <div className="p-5 text-sm font-semibold uppercase tracking-wider">Funcionalidade</div>
            <div className="p-5 text-center text-sm font-semibold uppercase tracking-wider">Visitante</div>
            <div className="bg-laranja p-5 text-center text-sm font-semibold uppercase tracking-wider text-marinho">
              PREMIUM
            </div>
          </div>
          {rows.map(([label, v, l], i) => (
            <div
              key={label}
              className={`grid grid-cols-3 items-center text-sm ${i % 2 ? "bg-secondary/50" : ""}`}
            >
              <div className="p-5 font-medium text-marinho">{label}</div>
              <div className="p-5 text-center text-muted-foreground">{cell(v)}</div>
              <div className="p-5 text-center font-semibold text-marinho">{cell(l)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function cell(v: boolean | string) {
  if (v === true) return <CheckCircle2 className="mx-auto h-5 w-5 text-teal" />;
  if (v === false) return <span className="text-muted-foreground/60">—</span>;
  return v;
}

function Testimonial() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center">
      <p className="font-display text-3xl font-semibold leading-snug text-marinho sm:text-4xl">
        “O Calourus transformou meu medo de começar a faculdade em empolgação.
        <span className="text-laranja"> Entendi meu curso antes mesmo da primeira aula.</span>”
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-laranja-soft font-display font-bold text-marinho">
          AS
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-marinho">Ana Souza</p>
          <p className="text-xs text-muted-foreground">Caloura de Engenharia · USP</p>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cadastro" className="mx-auto max-w-7xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-laranja/40 bg-card p-12 text-center shadow-[var(--shadow-elegant)] sm:p-16">
        <div className="absolute inset-x-0 top-0 h-1 bg-laranja" />
        <h2 className="font-display text-4xl font-bold text-marinho sm:text-5xl">
          Pronto para começar a faculdade com vantagem?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Cadastre-se em menos de 1 minuto e desbloqueie materiais, videoaulas e
          monitores do seu curso.
        </p>
        <a
          href="#"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-marinho px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-marinho-soft"
        >
          Criar minha conta <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-marinho text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-12 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-laranja font-display font-bold text-marinho">
            C
          </span>
          <span className="font-display text-lg font-bold">Calourus</span>
        </div>
        <p className="text-sm text-white/70">© 2026 Calourus · calourus.com.br&nbsp;</p>
      </div>
    </footer>
  );
}
