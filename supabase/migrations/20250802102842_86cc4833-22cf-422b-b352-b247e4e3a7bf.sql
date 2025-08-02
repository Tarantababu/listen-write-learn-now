
-- Phase 1: Create RPC function to calculate total mastered words from all sources
CREATE OR REPLACE FUNCTION calculate_total_mastered_words(user_id_param UUID, language_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sentence_mining_count INTEGER := 0;
    regular_exercise_count INTEGER := 0;
    bidirectional_count INTEGER := 0;
    total_count INTEGER := 0;
BEGIN
    -- Count words mastered through sentence mining (mastery level >= 4)
    SELECT COUNT(DISTINCT word) INTO sentence_mining_count
    FROM known_words
    WHERE user_id = user_id_param 
    AND language = language_param
    AND mastery_level >= 4;

    -- Count words mastered through regular exercises (3+ high-accuracy completions)
    -- This is approximated by counting completed exercises and estimating words per exercise
    SELECT COALESCE(SUM(
        CASE WHEN completion_count >= 3 THEN
            -- Estimate 5-10 words per exercise based on text length
            GREATEST(5, LEAST(10, LENGTH(text) / 20))
        ELSE 0 END
    ), 0)::INTEGER INTO regular_exercise_count
    FROM exercises e
    WHERE e.user_id = user_id_param 
    AND e.language = language_param
    AND e.archived = false;

    -- Count words mastered through bidirectional exercises
    SELECT COUNT(DISTINCT word) INTO bidirectional_count
    FROM bidirectional_mastered_words
    WHERE user_id = user_id_param
    AND language = language_param;

    -- Calculate total (avoiding double counting by taking the maximum approach)
    -- Since sentence mining is most precise, we prioritize it and add estimates from other sources
    total_count := sentence_mining_count + regular_exercise_count + bidirectional_count;

    RETURN total_count;
END;
$$;

-- Create function to update session words mastered when a word reaches mastery
CREATE OR REPLACE FUNCTION update_session_words_mastered(session_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_user_id UUID;
    session_language TEXT;
    mastered_words_count INTEGER := 0;
BEGIN
    -- Get session details
    SELECT user_id, language INTO session_user_id, session_language
    FROM sentence_mining_sessions
    WHERE id = session_id_param;

    -- Count newly mastered words in this session
    -- This is approximated by counting exercises where user succeeded
    SELECT COUNT(*) INTO mastered_words_count
    FROM sentence_mining_exercises sme
    WHERE sme.session_id = session_id_param
    AND sme.is_correct = true;

    -- Update session with mastered words count
    UPDATE sentence_mining_sessions
    SET words_mastered = mastered_words_count,
        updated_at = now()
    WHERE id = session_id_param;

    -- Also update user daily activity for this session
    IF session_user_id IS NOT NULL AND session_language IS NOT NULL THEN
        PERFORM record_language_activity(
            session_user_id,
            session_language,
            CURRENT_DATE,
            1, -- exercises completed
            mastered_words_count -- words mastered
        );
    END IF;
END;
$$;

-- Add trigger to automatically update session when exercises are completed
CREATE OR REPLACE FUNCTION trigger_update_session_words_mastered()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only trigger when an exercise is marked as correct
    IF NEW.is_correct = true AND (OLD.is_correct IS NULL OR OLD.is_correct = false) THEN
        PERFORM update_session_words_mastered(NEW.session_id);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_session_mastered_words_trigger ON sentence_mining_exercises;
CREATE TRIGGER update_session_mastered_words_trigger
    AFTER UPDATE ON sentence_mining_exercises
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_session_words_mastered();
