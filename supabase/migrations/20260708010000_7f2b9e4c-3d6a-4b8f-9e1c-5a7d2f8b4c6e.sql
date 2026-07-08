-- Mark the two elective ("optativa") subjects called out in the topic
-- list, so it's reflected somewhere real instead of only in conversation.
update public.question_topics
set description = 'Disciplina optativa.'
where slug in ('direito-hermeneutica-juridica', 'direito-direito-internacional-privado');

update public.flashcard_topics
set description = 'Disciplina optativa.'
where slug in ('direito-hermeneutica-juridica', 'direito-direito-internacional-privado');
