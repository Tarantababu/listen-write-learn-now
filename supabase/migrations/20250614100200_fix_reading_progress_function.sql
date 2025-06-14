
-- Fix the update_reading_exercise_progress function to work with JSONB content structure
CREATE OR REPLACE FUNCTION update_reading_exercise_progress(
  exercise_id_param UUID,
  user_id_param UUID,
  sentence_index_param INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_sentences_count INTEGER;
  completion_percent DECIMAL(5,2);
BEGIN
  -- Get total sentences count from the JSONB content field
  SELECT jsonb_array_length(content->'sentences') INTO total_sentences_count
  FROM public.reading_exercises
  WHERE id = exercise_id_param;
  
  -- Handle case where exercise doesn't exist or has no sentences
  IF total_sentences_count IS NULL OR total_sentences_count = 0 THEN
    total_sentences_count := 1; -- Prevent division by zero
  END IF;
  
  -- Calculate completion percentage
  completion_percent := (sentence_index_param::DECIMAL / total_sentences_count::DECIMAL) * 100;
  
  -- Insert or update progress
  INSERT INTO public.reading_exercise_progress (
    user_id,
    reading_exercise_id,
    sentences_completed,
    total_sentences,
    completion_percentage,
    last_sentence_index
  )
  VALUES (
    user_id_param,
    exercise_id_param,
    sentence_index_param,
    total_sentences_count,
    completion_percent,
    sentence_index_param
  )
  ON CONFLICT (user_id, reading_exercise_id)
  DO UPDATE SET
    sentences_completed = sentence_index_param,
    total_sentences = total_sentences_count,
    completion_percentage = completion_percent,
    last_sentence_index = sentence_index_param,
    updated_at = now(),
    completed_at = CASE 
      WHEN completion_percent >= 100 THEN now()
      ELSE NULL
    END;
END;
$$;
