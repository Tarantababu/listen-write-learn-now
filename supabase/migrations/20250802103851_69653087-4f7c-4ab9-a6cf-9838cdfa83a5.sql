
-- Drop the enhanced analytics functions
DROP FUNCTION IF EXISTS public.calculate_total_mastered_words(uuid, text);
DROP FUNCTION IF EXISTS public.update_session_words_mastered(uuid);
DROP FUNCTION IF EXISTS public.trigger_update_session_words_mastered();

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_session_words_mastered ON sentence_mining_exercises;
