
-- Add function to check bidirectional exercise count for a user
CREATE OR REPLACE FUNCTION public.get_user_bidirectional_exercise_count(user_id_param uuid, target_language_param text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.bidirectional_exercises
    WHERE user_id = user_id_param
    AND target_language = target_language_param
  );
END;
$$;
