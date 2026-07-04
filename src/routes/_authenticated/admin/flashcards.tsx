import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layers, Plus, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCoursesAndAreas } from "@/components/use-courses-and-areas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const NO_COURSE = "__none__";
const NO_AREA = "__none__";

export const Route = createFileRoute("/_authenticated/admin/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards — Painel administrativo — Calourus" },
      { name: "description", content: "Crie e organize os tópicos e cartões de estudo da Calourus." },
    ],
  }),
  component: AdminFlashcardsPage,
});

type Topic = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  course_id: string | null;
  area_id: string | null;
  cardCount: number;
};

type Card = {
  id: string;
  topic_id: string;
  question: string;
  answer: string;
  sort_order: number;
};

function slugify(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function AdminFlashcardsPage() {
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [loadingCards, setLoadingCards] = useState(false);

  async function loadTopics(keepSelection = true) {
    const { data, error } = await supabase
      .from("flashcard_topics")
      .select("id, slug, title, description, sort_order, course_id, area_id, flashcards(count)")
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error(error.message);
      return;
    }

    const mapped: Topic[] = (data ?? []).map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      sort_order: t.sort_order,
      course_id: t.course_id,
      area_id: t.area_id,
      cardCount: (t.flashcards as unknown as { count: number }[])?.[0]?.count ?? 0,
    }));
    setTopics(mapped);

    if (!keepSelection || (selectedId && !mapped.some((t) => t.id === selectedId))) {
      setSelectedId(mapped[0]?.id ?? null);
    } else if (selectedId === null && mapped.length > 0) {
      setSelectedId(mapped[0].id);
    }
  }

  async function loadCards(topicId: string) {
    setLoadingCards(true);
    const { data, error } = await supabase
      .from("flashcards")
      .select("id, topic_id, question, answer, sort_order")
      .eq("topic_id", topicId)
      .order("sort_order", { ascending: true });
    setLoadingCards(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCards(data ?? []);
  }

  useEffect(() => {
    loadTopics(false);
  }, []);

  useEffect(() => {
    if (selectedId) loadCards(selectedId);
    else setCards(null);
  }, [selectedId]);

  const selectedTopic = topics?.find((t) => t.id === selectedId) ?? null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-3xl bg-gradient-to-br from-marinho to-marinho-soft p-10 text-primary-foreground shadow-[var(--shadow-elegant)]">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest">
          <Layers className="h-3.5 w-3.5" /> Conteúdo Premium
        </span>
        <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
          Organize os <span className="text-laranja">flashcards</span>
        </h1>
        <p className="mt-2 max-w-lg text-white/80">
          Crie tópicos e cartões — é exatamente isso que os estudantes Premium verão em "Flashcards".
        </p>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Topics column */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-elegant)]">
          <div className="flex items-center justify-between px-2 pb-3">
            <h2 className="font-display text-lg font-bold text-marinho">Tópicos</h2>
            <TopicFormDialog
              trigger={
                <Button size="sm" variant="secondary" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Novo
                </Button>
              }
              onSaved={() => loadTopics()}
            />
          </div>

          {topics === null && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Carregando…</p>
          )}
          {topics !== null && topics.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Nenhum tópico ainda. Crie o primeiro acima.
            </p>
          )}
          <div className="grid gap-1">
            {topics?.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedId(topic.id)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  topic.id === selectedId
                    ? "bg-laranja-soft font-semibold text-marinho"
                    : "text-marinho hover:bg-secondary"
                }`}
              >
                <span className="truncate">{topic.title}</span>
                <span className="ml-2 shrink-0 rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  {topic.cardCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cards column */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]">
          {!selectedTopic && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Selecione ou crie um tópico para gerenciar seus cartões.
            </p>
          )}

          {selectedTopic && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-marinho">{selectedTopic.title}</h2>
                  {selectedTopic.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{selectedTopic.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">/{selectedTopic.slug}</p>
                </div>
                <div className="flex gap-2">
                  <TopicFormDialog
                    topic={selectedTopic}
                    trigger={
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Pencil className="h-3.5 w-3.5" /> Editar tópico
                      </Button>
                    }
                    onSaved={() => loadTopics()}
                  />
                  <DeleteTopicButton topic={selectedTopic} onDeleted={() => loadTopics(false)} />
                </div>
              </div>

              <div className="my-6 h-px bg-border" />

              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-marinho">Cartões</h3>
                <CardFormDialog
                  topicId={selectedTopic.id}
                  nextPosition={cards?.length ?? 0}
                  trigger={
                    <Button size="sm" variant="secondary" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Novo cartão
                    </Button>
                  }
                  onSaved={() => {
                    loadCards(selectedTopic.id);
                    loadTopics();
                  }}
                />
              </div>

              {loadingCards && (
                <div className="grid place-items-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-marinho" />
                </div>
              )}

              {!loadingCards && cards?.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum cartão neste tópico ainda.
                </p>
              )}

              {!loadingCards && cards && cards.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {cards.map((card) => (
                    <div key={card.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                      <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
                      <div className="grid flex-1 gap-1 sm:grid-cols-2 sm:gap-4">
                        <p className="text-sm font-medium text-marinho">{card.question}</p>
                        <p className="text-sm text-muted-foreground">{card.answer}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <CardFormDialog
                          topicId={selectedTopic.id}
                          card={card}
                          nextPosition={cards.length}
                          trigger={
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                          onSaved={() => loadCards(selectedTopic.id)}
                        />
                        <DeleteCardButton
                          card={card}
                          onDeleted={() => {
                            loadCards(selectedTopic.id);
                            loadTopics();
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function TopicFormDialog({
  topic,
  trigger,
  onSaved,
}: {
  topic?: Topic;
  trigger: React.ReactNode;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(topic?.title ?? "");
  const [description, setDescription] = useState(topic?.description ?? "");
  const [courseId, setCourseId] = useState<string>(topic?.course_id ?? NO_COURSE);
  const [areaId, setAreaId] = useState<string>(topic?.area_id ?? NO_AREA);
  const [saving, setSaving] = useState(false);
  const { courses, areas } = useCoursesAndAreas();
  const areasForCourse = areas.filter((a) => a.course_id === courseId);

  useEffect(() => {
    if (open) {
      setTitle(topic?.title ?? "");
      setDescription(topic?.description ?? "");
      setCourseId(topic?.course_id ?? NO_COURSE);
      setAreaId(topic?.area_id ?? NO_AREA);
    }
  }, [open, topic]);

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Dê um título ao tópico.");
      return;
    }
    setSaving(true);
    try {
      const courseAreaPayload = {
        course_id: courseId === NO_COURSE ? null : courseId,
        area_id: areaId === NO_AREA ? null : areaId,
      };
      if (topic) {
        const { error } = await supabase
          .from("flashcard_topics")
          .update({ title: title.trim(), description: description.trim() || null, ...courseAreaPayload })
          .eq("id", topic.id);
        if (error) throw error;
        toast.success("Tópico atualizado.");
      } else {
        const { count } = await supabase
          .from("flashcard_topics")
          .select("id", { count: "exact", head: true });
        const baseSlug = slugify(title) || "topico";
        let slug = baseSlug;
        let attempt = 1;
        // Ensure slug uniqueness (topics are rarely created concurrently, so a small retry loop is enough)
        while (true) {
          const { data: existing } = await supabase
            .from("flashcard_topics")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();
          if (!existing) break;
          attempt += 1;
          slug = `${baseSlug}-${attempt}`;
        }
        const { error } = await supabase.from("flashcard_topics").insert({
          slug,
          title: title.trim(),
          description: description.trim() || null,
          sort_order: count ?? 0,
          ...courseAreaPayload,
        });
        if (error) throw error;
        toast.success("Tópico criado.");
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar tópico.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{topic ? "Editar tópico" : "Novo tópico"}</DialogTitle>
          <DialogDescription>
            Tópicos organizam os flashcards que os estudantes Premium vão estudar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="topic-title">Título</Label>
            <Input id="topic-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Cálculo I" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="topic-description">Descrição (opcional)</Label>
            <Textarea
              id="topic-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Uma linha explicando o que o tópico cobre"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Curso (opcional)</Label>
              <Select value={courseId} onValueChange={(v) => { setCourseId(v); setAreaId(NO_AREA); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Geral (todos os cursos)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COURSE}>Geral (todos os cursos)</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Área (opcional)</Label>
              <Select value={areaId} onValueChange={setAreaId} disabled={courseId === NO_COURSE}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_AREA}>Sem área</SelectItem>
                  {areasForCourse.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTopicButton({ topic, onDeleted }: { topic: Topic; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const { error } = await supabase.from("flashcard_topics").delete().eq("id", topic.id);
      if (error) throw error;
      toast.success("Tópico removido.");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover tópico.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir "{topic.title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso remove o tópico e todos os {topic.cardCount} cartões dentro dele. Não pode ser desfeito.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CardFormDialog({
  topicId,
  card,
  nextPosition,
  trigger,
  onSaved,
}: {
  topicId: string;
  card?: Card;
  nextPosition: number;
  trigger: React.ReactNode;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState(card?.question ?? "");
  const [answer, setAnswer] = useState(card?.answer ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setQuestion(card?.question ?? "");
      setAnswer(card?.answer ?? "");
    }
  }, [open, card]);

  async function handleSave() {
    if (!question.trim() || !answer.trim()) {
      toast.error("Preencha a pergunta e a resposta do cartão.");
      return;
    }
    setSaving(true);
    try {
      if (card) {
        const { error } = await supabase
          .from("flashcards")
          .update({ question: question.trim(), answer: answer.trim() })
          .eq("id", card.id);
        if (error) throw error;
        toast.success("Cartão atualizado.");
      } else {
        const { error } = await supabase.from("flashcards").insert({
          topic_id: topicId,
          question: question.trim(),
          answer: answer.trim(),
          sort_order: nextPosition,
        });
        if (error) throw error;
        toast.success("Cartão criado.");
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar cartão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{card ? "Editar cartão" : "Novo cartão"}</DialogTitle>
          <DialogDescription>A pergunta aparece na frente; a resposta, no verso.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="card-question">Pergunta</Label>
            <Textarea id="card-question" value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="card-answer">Resposta</Label>
            <Textarea id="card-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCardButton({ card, onDeleted }: { card: Card; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const { error } = await supabase.from("flashcards").delete().eq("id", card.id);
      if (error) throw error;
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover cartão.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8 text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </Button>
  );
}
