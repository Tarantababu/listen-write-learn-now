
-- Create known_words table to track user's vocabulary knowledge
CREATE TABLE public.known_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  mastery_level INTEGER NOT NULL DEFAULT 1, -- 1=learning, 2=familiar, 3=known, 4=mastered
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  review_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, word, language)
);

-- Enable RLS
ALTER TABLE public.known_words ENABLE ROW LEVEL SECURITY;

-- Create policies for known_words
CREATE POLICY "Users can manage their own known words"
  ON public.known_words
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create sentence_mining_sessions table for tracking practice sessions
CREATE TABLE public.sentence_mining_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  difficulty_level TEXT NOT NULL,
  exercise_types TEXT[] NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_exercises INTEGER NOT NULL DEFAULT 0,
  correct_exercises INTEGER NOT NULL DEFAULT 0,
  new_words_encountered INTEGER NOT NULL DEFAULT 0,
  words_mastered INTEGER NOT NULL DEFAULT 0,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sentence_mining_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for sentence_mining_sessions
CREATE POLICY "Users can manage their own sentence mining sessions"
  ON public.sentence_mining_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create sentence_mining_exercises table for storing generated exercises
CREATE TABLE public.sentence_mining_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sentence_mining_sessions(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  sentence TEXT NOT NULL,
  translation TEXT,
  target_words TEXT[] NOT NULL,
  unknown_words TEXT[] NOT NULL,
  difficulty_score NUMERIC NOT NULL DEFAULT 0,
  user_response TEXT,
  is_correct BOOLEAN,
  completion_time INTEGER, -- in seconds
  hints_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.sentence_mining_exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for sentence_mining_exercises
CREATE POLICY "Users can manage exercises from their own sessions"
  ON public.sentence_mining_exercises
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.sentence_mining_sessions sms 
    WHERE sms.id = sentence_mining_exercises.session_id 
    AND sms.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sentence_mining_sessions sms 
    WHERE sms.id = sentence_mining_exercises.session_id 
    AND sms.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_known_words_user_language ON public.known_words(user_id, language);
CREATE INDEX idx_known_words_next_review ON public.known_words(user_id, next_review_date) WHERE next_review_date IS NOT NULL;
CREATE INDEX idx_sentence_mining_sessions_user ON public.sentence_mining_sessions(user_id, created_at DESC);
CREATE INDEX idx_sentence_mining_exercises_session ON public.sentence_mining_exercises(session_id);

-- Create function to update word mastery based on performance
CREATE OR REPLACE FUNCTION public.update_word_mastery(
  user_id_param UUID,
  word_param TEXT,
  language_param TEXT,
  is_correct_param BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_mastery INTEGER;
  current_review_count INTEGER;
  current_correct_count INTEGER;
  new_mastery INTEGER;
  next_review_interval INTEGER;
BEGIN
  -- Get current word data or create if doesn't exist
  INSERT INTO public.known_words (user_id, word, language, mastery_level, review_count, correct_count)
  VALUES (user_id_param, word_param, language_param, 1, 0, 0)
  ON CONFLICT (user_id, word, language) DO NOTHING;
  
  -- Get current stats
  SELECT mastery_level, review_count, correct_count
  INTO current_mastery, current_review_count, current_correct_count
  FROM public.known_words
  WHERE user_id = user_id_param AND word = word_param AND language = language_param;
  
  -- Update review count
  current_review_count := current_review_count + 1;
  
  -- Update correct count if answer was correct
  IF is_correct_param THEN
    current_correct_count := current_correct_count + 1;
  END IF;
  
  -- Calculate new mastery level based on performance
  IF is_correct_param THEN
    -- Correct answer: potentially increase mastery
    IF current_mastery < 4 AND current_correct_count >= current_mastery * 2 THEN
      new_mastery := LEAST(current_mastery + 1, 4);
    ELSE
      new_mastery := current_mastery;
    END IF;
  ELSE
    -- Incorrect answer: potentially decrease mastery
    IF current_mastery > 1 THEN
      new_mastery := GREATEST(current_mastery - 1, 1);
    ELSE
      new_mastery := current_mastery;
    END IF;
  END IF;
  
  -- Calculate next review interval based on mastery level
  CASE new_mastery
    WHEN 1 THEN next_review_interval := 1;  -- 1 day
    WHEN 2 THEN next_review_interval := 3;  -- 3 days
    WHEN 3 THEN next_review_interval := 7;  -- 1 week
    WHEN 4 THEN next_review_interval := 30; -- 1 month
    ELSE next_review_interval := 1;
  END CASE;
  
  -- Update the word record
  UPDATE public.known_words
  SET 
    mastery_level = new_mastery,
    review_count = current_review_count,
    correct_count = current_correct_count,
    last_reviewed_at = now(),
    next_review_date = (CURRENT_DATE + INTERVAL '1 day' * next_review_interval)::DATE,
    updated_at = now()
  WHERE user_id = user_id_param AND word = word_param AND language = language_param;
END;
$$;

-- Create function to get words that need review
CREATE OR REPLACE FUNCTION public.get_words_for_review(
  user_id_param UUID,
  language_param TEXT,
  limit_param INTEGER DEFAULT 50
) RETURNS TABLE (
  word TEXT,
  mastery_level INTEGER,
  days_overdue INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kw.word,
    kw.mastery_level,
    (CURRENT_DATE - kw.next_review_date)::INTEGER as days_overdue
  FROM public.known_words kw
  WHERE kw.user_id = user_id_param 
    AND kw.language = language_param
    AND kw.next_review_date <= CURRENT_DATE
  ORDER BY kw.next_review_date ASC, kw.mastery_level ASC
  LIMIT limit_param;
END;
$$;
