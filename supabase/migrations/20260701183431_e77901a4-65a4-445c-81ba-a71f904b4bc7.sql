
CREATE TABLE public.flashcard_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flashcard_topics TO authenticated;
GRANT ALL ON public.flashcard_topics TO service_role;
ALTER TABLE public.flashcard_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view topics" ON public.flashcard_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage topics" ON public.flashcard_topics FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.flashcard_topics(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view flashcards" ON public.flashcards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage flashcards" ON public.flashcards FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_flashcard_topics_updated BEFORE UPDATE ON public.flashcard_topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_flashcards_updated BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_flashcards_topic ON public.flashcards(topic_id, sort_order);

-- Seed data
INSERT INTO public.flashcard_topics (slug, title, description, sort_order) VALUES
  ('calculo-1', 'Cálculo I', 'Limites, derivadas e integrais básicas.', 1),
  ('programacao', 'Programação', 'Fundamentos de lógica e algoritmos.', 2),
  ('portugues', 'Português', 'Gramática e interpretação de texto.', 3);

INSERT INTO public.flashcards (topic_id, question, answer, sort_order)
SELECT id, q, a, ord FROM public.flashcard_topics t
JOIN (VALUES
  ('calculo-1', 'Qual a definição de derivada?', 'É o limite da razão incremental: f''(x) = lim (h→0) [f(x+h) - f(x)] / h.', 1),
  ('calculo-1', 'Qual a integral de x²?', '(x³)/3 + C', 2),
  ('calculo-1', 'Quanto vale lim (x→0) sen(x)/x ?', '1', 3),
  ('programacao', 'O que é uma variável?', 'Um espaço nomeado na memória que armazena um valor que pode variar.', 1),
  ('programacao', 'Diferença entre pilha e fila?', 'Pilha é LIFO (último a entrar, primeiro a sair); Fila é FIFO (primeiro a entrar, primeiro a sair).', 2),
  ('portugues', 'O que é um sujeito oculto?', 'É o sujeito que não aparece explicitamente na frase, mas pode ser identificado pela desinência verbal.', 1),
  ('portugues', 'Cite três figuras de linguagem.', 'Metáfora, metonímia e hipérbole.', 2)
) AS seed(topic_slug, q, a, ord) ON t.slug = seed.topic_slug;
