import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileQuestion, Plus, Pencil, Trash2, Loader2, GripVertical, ListChecks, PenLine } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/_authenticated/admin/questions")({
  head: () => ({
    meta: [
      { title: "Banco de Questões — Painel administrativo — Calourus" },
      { name: "description", content: "Crie e organize os tópicos e questões do banco de questões da Calourus." },
    ],
  }),
  component: AdminQuestionsPage,
});

type Topic = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  course_id: string | null;
  area_id: string | null;
  questionCount: number;
};

type QuestionType = "multiple_choice" | "essay";

type Question = {
  id: string;
  topic_id: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correct_option: number | null;
  explanation: string | null;
  sort_order: number;
};

const NO_COURSE = "__none__";
const NO_AREA = "__none__";

function slugify(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function AdminQuestionsPage() {
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  async function loadTopics(keepSelection = true) {
    const { data, error } = await supabase
      .from("question_topics")
      .select("id, slug, title, description, sort_order, course_id, area_id, questions(count)")
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
      questionCount: (t.questions as unknown as { count: number }[])?.[0]?.count ?? 0,
    }));
    setTopics(mapped);

    if (!keepSelection || (selectedId && !mapped.some((t) => t.id === selectedId))) {
      setSelectedId(mapped[0]?.id ?? null);
    } else if (selectedId === null && mapped.length > 0) {
      setSelectedId(mapped[0].id);
    }
  }

  async function loadQuestions(topicId: string) {
    setLoadingQuestions(true);
    const { data, error } = await supabase
      .from("questions")
      .select("id, topic_id, type, prompt, options, correct_option, explanation, sort_order")
      .eq("topic_id", topicId)
      .order("sort_order", { ascending: true });
    setLoadingQuestions(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setQuestions((data ?? []) as Question[]);
  }

  useEffect(() => {
    loadTopics(false);
  }, []);

  useEffect(() => {
    if (selectedId) loadQuestions(selectedId);
    else setQuestions(null);
  }, [selectedId]);

  const selectedTopic = topics?.find((t) => t.id === selectedId) ?? null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-3xl bg-gradient-to-br from-marinho to-marinho-soft p-10 text-primary-foreground shadow-[var(--shadow-elegant)]">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest">
          <FileQuestion className="h-3.5 w-3.5" /> Banco de Questões
        </span>
        <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
          Organize as <span className="text-laranja">questões</span>
        </h1>
        <p className="mt-2 max-w-lg text-white/80">
          Crie tópicos e questões — múltipla escolha ou dissertativa — para os estudantes praticarem.
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
                  {topic.questionCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Questions column */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]">
          {!selectedTopic && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Selecione ou crie um tópico para gerenciar suas questões.
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
                <h3 className="font-display text-base font-bold text-marinho">Questões</h3>
                <QuestionFormDialog
                  topicId={selectedTopic.id}
                  nextPosition={questions?.length ?? 0}
                  trigger={
                    <Button size="sm" variant="secondary" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Nova questão
                    </Button>
                  }
                  onSaved={() => {
                    loadQuestions(selectedTopic.id);
                    loadTopics();
                  }}
                />
              </div>

              {loadingQuestions && (
                <div className="grid place-items-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-marinho" />
                </div>
              )}

              {!loadingQuestions && questions?.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma questão neste tópico ainda.
                </p>
              )}

              {!loadingQuestions && questions && questions.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {questions.map((q) => (
                    <div key={q.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                      <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1 text-xs">
                            {q.type === "multiple_choice" ? (
                              <>
                                <ListChecks className="h-3 w-3" /> Múltipla escolha
                              </>
                            ) : (
                              <>
                                <PenLine className="h-3 w-3" /> Dissertativa
                              </>
                            )}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-marinho">{q.prompt}</p>
                        {q.type === "multiple_choice" && q.options && (
                          <ul className="mt-1.5 grid gap-0.5 text-xs text-muted-foreground">
                            {q.options.map((opt, i) => (
                              <li key={i} className={i === q.correct_option ? "font-semibold text-teal" : undefined}>
                                {i === q.correct_option ? "✓ " : "· "}
                                {opt}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <QuestionFormDialog
                          topicId={selectedTopic.id}
                          question={q}
                          nextPosition={questions.length}
                          trigger={
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                          onSaved={() => loadQuestions(selectedTopic.id)}
                        />
                        <DeleteQuestionButton
                          question={q}
                          onDeleted={() => {
                            loadQuestions(selectedTopic.id);
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
  const areasForCourse = areas.filter((a) => a.course_id === null || a.course_id === courseId);

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
          .from("question_topics")
          .update({ title: title.trim(), description: description.trim() || null, ...courseAreaPayload })
          .eq("id", topic.id);
        if (error) throw error;
        toast.success("Tópico atualizado.");
      } else {
        const { count } = await supabase
          .from("question_topics")
          .select("id", { count: "exact", head: true });
        const baseSlug = slugify(title) || "topico";
        let slug = baseSlug;
        let attempt = 1;
        while (true) {
          const { data: existing } = await supabase
            .from("question_topics")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();
          if (!existing) break;
          attempt += 1;
          slug = `${baseSlug}-${attempt}`;
        }
        const { error } = await supabase.from("question_topics").insert({
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
            Tópicos organizam as questões que os estudantes vão praticar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="qtopic-title">Título</Label>
            <Input id="qtopic-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Cálculo I" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qtopic-description">Descrição (opcional)</Label>
            <Textarea
              id="qtopic-description"
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
              <Select value={areaId} onValueChange={setAreaId}>
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
      const { error } = await supabase.from("question_topics").delete().eq("id", topic.id);
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
            Isso remove o tópico e todas as {topic.questionCount} questões dentro dele. Não pode ser desfeito.
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

function QuestionFormDialog({
  topicId,
  question,
  nextPosition,
  trigger,
  onSaved,
}: {
  topicId: string;
  question?: Question;
  nextPosition: number;
  trigger: React.ReactNode;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<QuestionType>(question?.type ?? "multiple_choice");
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [options, setOptions] = useState<string[]>(question?.options ?? ["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState<number>(question?.correct_option ?? 0);
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType(question?.type ?? "multiple_choice");
      setPrompt(question?.prompt ?? "");
      setOptions(question?.options ?? ["", "", "", ""]);
      setCorrectOption(question?.correct_option ?? 0);
      setExplanation(question?.explanation ?? "");
    }
  }, [open, question]);

  function updateOption(i: number, value: string) {
    setOptions((opts) => opts.map((o, idx) => (idx === i ? value : o)));
  }

  function addOption() {
    setOptions((opts) => [...opts, ""]);
  }

  function removeOption(i: number) {
    setOptions((opts) => opts.filter((_, idx) => idx !== i));
    setCorrectOption((c) => (c === i ? 0 : c > i ? c - 1 : c));
  }

  async function handleSave() {
    if (!prompt.trim()) {
      toast.error("Escreva o enunciado da questão.");
      return;
    }
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (type === "multiple_choice") {
      if (cleanOptions.length < 2) {
        toast.error("Adicione ao menos 2 alternativas.");
        return;
      }
      if (correctOption >= cleanOptions.length) {
        toast.error("Selecione qual alternativa é a correta.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload =
        type === "multiple_choice"
          ? {
              type,
              prompt: prompt.trim(),
              options: cleanOptions,
              correct_option: correctOption,
              explanation: explanation.trim() || null,
            }
          : {
              type,
              prompt: prompt.trim(),
              options: null,
              correct_option: null,
              explanation: explanation.trim() || null,
            };

      if (question) {
        const { error } = await supabase.from("questions").update(payload).eq("id", question.id);
        if (error) throw error;
        toast.success("Questão atualizada.");
      } else {
        const { error } = await supabase.from("questions").insert({
          topic_id: topicId,
          sort_order: nextPosition,
          ...payload,
        });
        if (error) throw error;
        toast.success("Questão criada.");
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar questão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? "Editar questão" : "Nova questão"}</DialogTitle>
          <DialogDescription>
            Múltipla escolha exige alternativas e a correta marcada; dissertativa só precisa do enunciado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("multiple_choice")}
                className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                  type === "multiple_choice" ? "border-laranja bg-laranja-soft text-marinho" : "border-border text-muted-foreground"
                }`}
              >
                <ListChecks className="mr-1.5 inline h-3.5 w-3.5" /> Múltipla escolha
              </button>
              <button
                type="button"
                onClick={() => setType("essay")}
                className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                  type === "essay" ? "border-laranja bg-laranja-soft text-marinho" : "border-border text-muted-foreground"
                }`}
              >
                <PenLine className="mr-1.5 inline h-3.5 w-3.5" /> Dissertativa
              </button>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="q-prompt">Enunciado</Label>
            <Textarea id="q-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} />
          </div>

          {type === "multiple_choice" && (
            <div className="grid gap-1.5">
              <Label>Alternativas (marque a correta)</Label>
              <div className="grid gap-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrectOption(i)}
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition ${
                        correctOption === i
                          ? "border-teal bg-teal/10 text-teal"
                          : "border-border text-muted-foreground hover:border-teal/50"
                      }`}
                      title="Marcar como correta"
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                    <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Alternativa ${i + 1}`} />
                    {options.length > 2 && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removeOption(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="mt-1 w-fit gap-1.5" onClick={addOption}>
                <Plus className="h-3.5 w-3.5" /> Adicionar alternativa
              </Button>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="q-explanation">
              {type === "essay" ? "Resposta esperada (opcional)" : "Explicação (opcional)"}
            </Label>
            <Textarea
              id="q-explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder={
                type === "essay"
                  ? "Mostrada ao aluno depois que ele enviar a resposta dele, para autoavaliação."
                  : "Mostrada ao aluno depois de responder, explicando a alternativa correta."
              }
            />
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

function DeleteQuestionButton({ question, onDeleted }: { question: Question; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const { error } = await supabase.from("questions").delete().eq("id", question.id);
      if (error) throw error;
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover questão.");
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
