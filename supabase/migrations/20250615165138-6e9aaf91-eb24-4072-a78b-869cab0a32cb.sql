
-- Create function to get user reading exercise count
CREATE OR REPLACE FUNCTION public.get_user_reading_exercise_count(user_id_param uuid, language_param text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.reading_exercises
    WHERE user_id = user_id_param
    AND language = language_param
    AND archived = false
  );
END;
$function$
