
REVOKE ALL ON FUNCTION public.get_daily_question_usage() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_question_attempt(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_question_topics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_topic_questions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_question_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_question_attempt(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_question_topics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_topic_questions(uuid) TO authenticated;
