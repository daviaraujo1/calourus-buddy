import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookMarked,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileQuestion,
  LayoutDashboard,
  LineChart,
  ListChecks,
  MessageCircle,
  PlayCircle,
  Scale,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";

import heroImg from "@/assets/hero-law-cartoon.png";
import logoImg from "@/assets/logo-calourus.png";
import { supabase } from "@/integrations/supabase/client";
import { buildKiwifyCheckoutUrl } from "@/lib/kiwify";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calourus - Prática para concursos públicos" },
      {
        name: "description",
        content:
          "Treine questões, simulados e revisões de Direito para concursos públicos com trilhas por banca, carreira e disciplina.",
      },
      {
        property: "og:title",
        content: "Calourus - Prática jurídica para concursos",
      },
      {
        property: "og:description",
        content:
          "Uma página inicial limpa e interativa para estudantes de concursos públicos voltados ao Direito.",
      },
    ],
  }),
  component: Home,
});

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  to?: string;
};

const disciplines = [
  "Constitucional",
  "Administrativo",
  "Penal",
  "Processo Civil",
  "Tributário",
  "Trabalho",
  "Previdenciário",
  "Eleitoral",
];

const featureCards: Feature[] = [
  {
    icon: FileQuestion,
    title: "Questões comentadas",
    desc: "Resolva por assunto e veja a explicação jurídica logo após responder.",
    to: "/questoes",
  },
  {
    icon: BookMarked,
    title: "Flashcards",
    desc: "Revise conceitos-chave em cartões rápidos, com repetição espaçada.",
    to: "/flashcards",
  },
  {
    icon: Timer,
    title: "Simulados por banca",
    desc: "Treinos no estilo Cebraspe, FGV, FCC e Vunesp com tempo controlado.",
  },
  {
    icon: LineChart,
    title: "Diagnóstico de desempenho",
    desc: "Entenda seus erros por matéria, assunto, banca e nível de dificuldade.",
  },
  {
    icon: MessageCircle,
    title: "Chat com IA para discussão de questões",
    desc: "Discuta questões, alternativas e fundamentos jurídicos com apoio inteligente.",
  },
];

const tracks = [
  {
    label: "Magistratura",
    meta: "Sentença, processo e constitucional",
    icon: Scale,
    tone: "bg-laranja text-marinho",
  },
  {
    label: "Ministério Público",
    meta: "Penal, tutela coletiva e teoria do crime",
    icon: ShieldCheck,
    tone: "bg-teal text-white",
  },
  {
    label: "Analista Judiciário",
    meta: "Tribunais, processo e administração pública",
    icon: ClipboardCheck,
    tone: "bg-marinho text-white",
  },
  {
    label: "Delegado",
    meta: "Investigação, penal e processo penal",
    icon: BadgeCheck,
    tone: "bg-laranja-soft text-marinho",
  },
];

const methodSteps = [
  {
    icon: SearchCheck,
    title: "Diagnóstico",
    text: "Você inicia por uma bateria curta para revelar pontos fortes e matérias que exigem reforço.",
  },
  {
    icon: ListChecks,
    title: "Plano do dia",
    text: "A plataforma organiza questões, lei seca e revisões em uma sequência objetiva.",
  },
  {
    icon: Target,
    title: "Treino guiado",
    text: "Cada sessão combina banca, assunto e dificuldade para tirar o aluno do estudo aleatório.",
  },
  {
    icon: Brain,
    title: "Revisão por erro",
    text: "O que você erra volta em ciclos inteligentes para consolidar memória e raciocínio jurídico.",
  },
];

const faqs = [
  {
    question: "A plataforma serve para quem está com pouca base em Direito?",
    answer:
      "Sim. As trilhas podem começar por fundamentos, leitura orientada da lei seca e questões introdutórias antes dos simulados completos.",
  },
  {
    question: "Posso estudar por banca específica?",
    answer:
      "Sim. A proposta é permitir filtros por banca, carreira, disciplina, assunto e nível de dificuldade.",
  },
  {
    question: "O foco é videoaula ou prática?",
    answer:
      "O foco inicial é prática: questões, simulados, revisão, diagnóstico e discussão com IA. As videoaulas serão adicionadas futuramente como apoio quando o aluno precisar reforçar um tema.",
  },
  {
    question: "Tem acesso gratuito?",
    answer:
      "Sim. O plano essencial permite criar uma rotina inicial e conhecer o fluxo da plataforma antes de assinar o acesso completo.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Nav />
      <main>
        <Hero />
        <ProblemSection />
        <PracticeLauncher />
        <Method />
        <Features />
        <Tracks />
        <Performance />
        <Plans />
        <FAQ />
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return authed;
}

function TopBar() {
  return (
    <div className="bg-marinho px-5 py-2 text-center text-xs font-bold uppercase text-primary-foreground sm:px-6">
      <span className="text-laranja">Semana de prática guiada:</span> comece pela trilha gratuita de
      Direito Constitucional.
    </div>
  );
}

function Nav() {
  const authed = useAuthed();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="Logo Calourus"
            width={40}
            height={40}
            className="h-10 w-10 rounded-[8px] object-cover shadow-sm"
          />
          <span className="font-display text-lg font-bold text-marinho">Calourus</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex">
          <a href="#plataforma" className="transition hover:text-marinho">
            Plataforma
          </a>
          <a href="#metodo" className="transition hover:text-marinho">
            Método
          </a>
          <a href="#planos" className="transition hover:text-marinho">
            Planos
          </a>
          <a href="#faq" className="transition hover:text-marinho">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {authed ? (
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-laranja px-4 text-sm font-bold text-marinho shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              <LayoutDashboard className="h-4 w-4" />
              Meu painel
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="hidden h-10 items-center rounded-[8px] px-3 text-sm font-semibold text-marinho transition hover:bg-secondary sm:inline-flex"
              >
                Entrar
              </Link>
              <Link
                to="/auth"
                className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-laranja px-4 text-sm font-bold text-marinho shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Começar
                <ArrowRight className="h-4 w-4" />
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
    <section className="relative isolate overflow-hidden bg-marinho text-primary-foreground">
      <img
        src={heroImg}
        alt="Ilustração cartoon de livros jurídicos, balança da justiça e painel de questões"
        width={1600}
        height={1200}
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-marinho/35 sm:bg-transparent" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgb(29 56 96 / 0.98) 0%, rgb(29 56 96 / 0.92) 42%, rgb(29 56 96 / 0.42) 64%, rgb(29 56 96 / 0.08) 100%)",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent_0%,rgb(29_56_96_/_0.12)_100%)]" />

      <div className="mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-6 sm:pt-18 lg:pb-14">
        <div className="max-w-3xl animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-[8px] border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase text-laranja backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Plataforma online para concursos jurídicos
          </span>

          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.04] sm:text-6xl lg:text-7xl">
            Calourus
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
            Uma plataforma limpa para você parar de estudar no escuro: questões comentadas,
            simulados por banca, lei seca ativa e revisão orientada para carreiras jurídicas.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-[8px] bg-laranja px-5 text-sm font-bold text-marinho shadow-[var(--shadow-glow)] transition hover:-translate-y-1 hover:brightness-105"
            >
              Começar minha rotina
              <PlayCircle className="h-4 w-4" />
            </Link>
            <a
              href="#plataforma"
              className="inline-flex h-12 items-center gap-2 rounded-[8px] border border-white/25 px-5 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Ver por dentro
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-8 grid max-w-3xl grid-cols-3 gap-2 text-[11px] text-white/75 sm:mt-10 sm:gap-3 sm:text-sm">
          {["Questões comentadas", "Simulados por banca", "Revisão guiada"].map((label, index) => (
            <div
              key={label}
              className="animate-fade-up rounded-[8px] border border-white/15 bg-white/10 px-3 py-3 backdrop-blur sm:px-4"
              style={{ animationDelay: `${120 + index * 90}ms` }}
            >
              <CheckCircle2 className="mb-2 h-4 w-4 text-laranja" />
              <p className="font-semibold leading-5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const points = [
    "Você resolve questões, mas não sabe se está melhorando.",
    "A lista de matérias cresce e o plano do dia fica confuso.",
    "A revisão depende de memória, não de um sistema.",
  ];

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
        <div>
          <p className="text-sm font-bold uppercase text-laranja">Estudo com direção</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-marinho sm:text-5xl">
            O problema não é estudar pouco. É estudar sem retorno claro.
          </h2>
        </div>

        <div className="grid gap-3">
          {points.map((point) => (
            <div
              key={point}
              className="flex items-start gap-3 rounded-[8px] border border-border bg-card p-4 shadow-[var(--shadow-elegant)]"
            >
              <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-[8px] bg-teal-soft text-marinho">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <p className="leading-7 text-card-foreground">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PracticeLauncher() {
  return (
    <section id="plataforma" className="border-b border-border bg-secondary/45">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div className="animate-fade-up">
          <p className="text-sm font-bold uppercase text-teal">Plataforma completa</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-marinho sm:text-5xl">
            Toque na matéria e entre direto no treino certo.
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
            Inspirada em plataformas educacionais de alta conversão, a tela organiza matérias,
            ferramentas e chamadas de ação sem tirar o foco da prática.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {disciplines.map((discipline, index) => (
              <Link
                key={discipline}
                to="/questoes"
                className="rounded-[8px] border border-border bg-card px-3 py-3 text-center text-sm font-bold text-marinho transition hover:-translate-y-0.5 hover:border-laranja hover:bg-laranja-soft"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {discipline}
              </Link>
            ))}
          </div>
        </div>

        <article className="animate-float-panel rounded-[8px] border border-border bg-card p-5 shadow-[var(--shadow-elegant)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-laranja">Treino prático</p>
              <h3 className="mt-1 font-display text-xl font-bold text-marinho">
                Controle de constitucionalidade
              </h3>
            </div>
            <span className="rounded-[8px] bg-teal-soft px-3 py-1 text-xs font-bold text-marinho">
              Nível médio
            </span>
          </div>

          <p className="mt-5 leading-7 text-card-foreground">
            Escolha o tipo de treino e avance com feedback imediato, marcação de erro e revisão
            programada.
          </p>

          <div className="mt-5 grid gap-3">
            {[
              ["Bateria rápida", "Itens objetivos para aquecer o raciocínio.", "/questoes"],
              ["Simulado FGV", "Tempo, dificuldade e estilo da banca.", "/questoes"],
              ["Lei seca", "Artigos essenciais com marcação de domínio.", "/flashcards"],
            ].map(([title, desc, to]) => (
              <Link
                key={title}
                to={to}
                className="group flex min-h-14 items-center justify-between rounded-[8px] border border-border bg-background px-4 text-left text-sm text-marinho transition hover:border-laranja hover:bg-laranja-soft"
              >
                <span>
                  <strong>{title}</strong>
                  <span className="block text-muted-foreground">{desc}</span>
                </span>
                <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/questoes"
              className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-marinho px-4 text-sm font-bold text-primary-foreground transition hover:bg-marinho-soft"
            >
              Treinar agora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/flashcards"
              className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-border px-4 text-sm font-bold text-marinho transition hover:bg-secondary"
            >
              Revisar com flashcards
              <BookMarked className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

function Method() {
  return (
    <section id="metodo" className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase text-laranja">Como funciona</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-marinho sm:text-5xl">
            Um método simples para transformar tentativa em progresso visível.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {methodSteps.map(({ icon: Icon, title, text }, index) => (
            <article
              key={title}
              className="animate-fade-up rounded-[8px] border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-teal hover:shadow-[var(--shadow-elegant)]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="grid h-11 w-11 place-items-center rounded-[8px] bg-marinho text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 font-display text-xl font-bold text-marinho">{title}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="recursos" className="bg-secondary/45">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="grid items-end gap-5 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-bold uppercase text-laranja">Ferramentas de estudo</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-marinho sm:text-5xl">
              Tudo que o aluno espera encontrar, sem poluição visual.
            </h2>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-border bg-card px-4 text-sm font-bold text-marinho transition hover:-translate-y-0.5 hover:border-teal"
          >
            Explorar plataforma
            <SearchCheck className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {featureCards.map(({ icon: Icon, title, desc, to }, index) => {
            const className =
              "animate-fade-up rounded-[8px] border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-laranja hover:shadow-[var(--shadow-elegant)]";
            const inner = (
              <>
                <div className="grid h-11 w-11 place-items-center rounded-[8px] bg-marinho text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-marinho">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{desc}</p>
              </>
            );
            return to ? (
              <Link key={title} to={to} className={className} style={{ animationDelay: `${index * 80}ms` }}>
                {inner}
              </Link>
            ) : (
              <article key={title} className={className} style={{ animationDelay: `${index * 80}ms` }}>
                {inner}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Tracks() {
  return (
    <section id="trilhas" className="border-y border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase text-teal">Trilhas por carreira</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-marinho sm:text-5xl">
            A página leva o aluno direto para a vaga que ele quer disputar.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tracks.map(({ label, meta, icon: Icon, tone }) => (
            <Link
              key={label}
              to="/dashboard"
              className="group rounded-[8px] border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-laranja hover:shadow-[var(--shadow-elegant)]"
            >
              <div className={`grid h-12 w-12 place-items-center rounded-[8px] ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 font-display text-xl font-bold text-marinho">{label}</p>
              <div className="mt-3 flex items-start justify-between gap-3 text-sm text-muted-foreground">
                <span>{meta}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1 group-hover:text-laranja" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Performance() {
  const metrics = [
    ["Direito Constitucional", "Domínio alto", "w-[86%]"],
    ["Direito Administrativo", "Em evolução", "w-[72%]"],
    ["Processo Penal", "Revisar hoje", "w-[58%]"],
  ];
  const floatingCards: Array<{ icon: LucideIcon; title: string; label: string; tone: string }> = [
    {
      icon: LineChart,
      title: "Evolução",
      label: "por disciplina",
      tone: "text-teal",
    },
    {
      icon: Target,
      title: "Plano do dia",
      label: "prioridade clara",
      tone: "text-laranja",
    },
    {
      icon: MessageCircle,
      title: "Chat IA",
      label: "discuta questões",
      tone: "text-teal",
    },
  ];

  return (
    <section id="progresso" className="overflow-hidden bg-[#f7f8fb]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:py-24">
        <div className="relative z-10">
          <p className="text-sm font-bold uppercase text-laranja">Painel de progresso</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-marinho sm:text-5xl">
            Veja sua preparação ganhar forma dentro da plataforma.
          </h2>
          <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
            Gráficos, prioridades e discussões com IA aparecem em uma área visual, amigável e
            objetiva para guiar a próxima sessão de estudo.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {["Diagnóstico por matéria", "Revisão por erro", "Videoaulas em breve"].map((tag) => (
              <span
                key={tag}
                className="rounded-[8px] border border-border bg-card px-3 py-2 text-xs font-bold uppercase text-marinho shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-h-[560px]">
          <div className="absolute left-0 top-4 hidden w-56 rounded-[8px] border border-border bg-card/95 p-4 shadow-[var(--shadow-elegant)] backdrop-blur md:block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-muted-foreground">
                Evolução das revisões
              </span>
              <LineChart className="h-4 w-4 text-teal" />
            </div>
            <div className="mt-4 flex h-24 items-end gap-2">
              {[42, 64, 50, 78, 70, 90, 84].map((height, index) => (
                <span
                  key={height + index}
                  className="w-full rounded-t bg-teal"
                  style={{ height: `${height}%`, opacity: 0.45 + index * 0.06 }}
                />
              ))}
            </div>
          </div>

          <div className="absolute left-8 top-40 hidden w-64 rounded-[8px] border border-border bg-card/95 p-4 shadow-[var(--shadow-elegant)] backdrop-blur sm:block">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[8px] bg-laranja-soft text-marinho">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-marinho">Chat com IA</p>
                <p className="text-xs text-muted-foreground">Explique a alternativa B.</p>
              </div>
            </div>
          </div>

          <div className="absolute right-0 top-5 w-[86%] max-w-[720px]">
            <div className="rounded-t-[18px] border border-marinho/20 bg-[#1b2636] p-3 shadow-[0_34px_80px_-36px_rgb(29_56_96_/_0.65)]">
              <div className="overflow-hidden rounded-[10px] bg-card">
                <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={logoImg}
                      alt="Logo Calourus"
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-[8px] object-cover"
                    />
                    <span className="font-display text-sm font-bold text-marinho">Calourus</span>
                  </div>
                  <span className="rounded-[8px] bg-teal-soft px-2.5 py-1 text-[11px] font-bold uppercase text-marinho">
                    Simulado ativo
                  </span>
                </div>

                <div className="grid gap-4 p-4 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="rounded-[8px] bg-marinho p-4 text-primary-foreground">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-laranja">Questão guiada</p>
                        <h3 className="mt-1 font-display text-xl font-bold">Constitucionalidade</h3>
                      </div>
                      <Timer className="h-5 w-5 text-teal" />
                    </div>
                    <div className="mt-5 grid gap-3">
                      {["Competência", "Controle concentrado", "Efeitos da decisão"].map(
                        (item, index) => (
                          <div
                            key={item}
                            className="flex items-center justify-between rounded-[8px] bg-white/10 px-3 py-2 text-sm"
                          >
                            <span>{item}</span>
                            <span className={index === 1 ? "text-laranja" : "text-white/55"}>
                              {index === 1 ? "prioridade" : "ok"}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-[8px] border border-border bg-secondary/70 p-4">
                      <p className="text-xs font-bold uppercase text-teal">Desempenho</p>
                      <div className="mt-4 grid gap-3">
                        {metrics.map(([label, value, width]) => (
                          <div key={label}>
                            <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-marinho">
                              <span>{label}</span>
                              <span className="text-laranja">{value}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-marinho/10">
                              <div
                                className={`h-full rounded-full bg-laranja ${width} animate-progress`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[8px] border border-dashed border-laranja/50 bg-laranja-soft/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-marinho">
                        <PlayCircle className="h-4 w-4 text-laranja" />
                        Videoaulas
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Serão adicionadas futuramente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto h-4 w-[92%] rounded-b-[20px] bg-[#27313f] shadow-[0_18px_45px_-24px_rgb(29_56_96_/_0.9)]" />
            <div className="mx-auto h-3 w-[70%] rounded-b-full bg-[#d8dde5]" />
          </div>

          <div className="absolute bottom-8 left-0 right-0 grid gap-3 sm:grid-cols-3 lg:left-12 lg:right-8">
            {floatingCards.map(({ icon: Icon, title, label, tone }) => (
              <div
                key={title}
                className="rounded-[8px] border border-border bg-card/95 p-4 shadow-[var(--shadow-elegant)] backdrop-blur"
              >
                <Icon className={`h-5 w-5 ${tone}`} />
                <p className="mt-3 font-display text-xl font-bold text-marinho">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Plans() {
  const freeFeatures = [
    "Rotina inicial de questões",
    "Simulado semanal de demonstração",
    "Painel básico de desempenho",
    "Revisões essenciais de lei seca",
  ];

  const premiumFeatures = [
    "Questões e simulados ilimitados",
    "Trilhas por carreira jurídica",
    "Comentários completos por alternativa",
    "Plano de revisão por erros",
    "Métricas por banca e assunto",
  ];

  return (
    <section id="planos" className="bg-secondary/45">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase text-laranja">Planos de acesso</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-marinho sm:text-5xl">
            Comece simples. Avance para o plano completo quando fizer sentido.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <PlanCard
            title="Essencial"
            price="Grátis"
            description="Para conhecer a plataforma e montar a primeira rotina."
            features={freeFeatures}
            action={
              <Link
                to="/auth"
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border border-border px-5 text-sm font-bold text-marinho transition hover:bg-secondary"
              >
                Criar conta grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />

          <PlanCard
            highlighted
            title="Premium"
            price="R$ 39,99"
            suffix="/mês"
            description="Para candidatos que querem volume, diagnóstico e constância."
            features={premiumFeatures}
            action={
              <a
                href={buildKiwifyCheckoutUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-laranja px-5 text-sm font-bold text-marinho shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Assinar Premium
                <ArrowRight className="h-4 w-4" />
              </a>
            }
          />
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  title,
  price,
  suffix,
  description,
  features,
  action,
  highlighted = false,
}: {
  title: string;
  price: string;
  suffix?: string;
  description: string;
  features: string[];
  action: ReactNode;
  highlighted?: boolean;
}) {
  return (
    <article
      className={`relative flex flex-col rounded-[8px] border bg-card p-6 shadow-[var(--shadow-elegant)] sm:p-7 ${
        highlighted ? "border-laranja" : "border-border"
      }`}
    >
      {highlighted && (
        <span className="absolute right-5 top-5 rounded-[8px] bg-laranja px-3 py-1 text-xs font-bold uppercase text-marinho">
          Mais completo
        </span>
      )}
      <p className="text-sm font-bold uppercase text-muted-foreground">{title}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-4xl font-bold text-marinho">{price}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-marinho">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            {feature}
          </li>
        ))}
      </ul>

      {action}
    </article>
  );
}

function FAQ() {
  return (
    <section id="faq" className="bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-20">
        <div>
          <p className="text-sm font-bold uppercase text-teal">Perguntas frequentes</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-marinho sm:text-5xl">
            Respostas rápidas antes de começar.
          </h2>
        </div>

        <div className="grid gap-3">
          {faqs.map(({ question, answer }) => (
            <details
              key={question}
              className="group rounded-[8px] border border-border bg-card p-5 shadow-[var(--shadow-elegant)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold text-marinho">
                {question}
                <ChevronDown className="h-5 w-5 shrink-0 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 leading-7 text-muted-foreground">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-background px-5 pb-16 sm:px-6 lg:pb-20">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[8px] bg-marinho px-6 py-10 text-primary-foreground sm:px-10 lg:px-12">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-bold uppercase text-laranja">Próxima sessão</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Transforme leitura jurídica em prática diária.
            </h2>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-laranja px-5 text-sm font-bold text-marinho shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Começar agora
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-5 py-8 sm:px-6 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="Logo Calourus"
            width={36}
            height={36}
            className="h-9 w-9 rounded-[8px] object-cover shadow-sm"
          />
          <span className="font-display text-lg font-bold text-marinho">Calourus</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 Calourus. Treino jurídico para concursos públicos.
        </p>
      </div>
    </footer>
  );
}
