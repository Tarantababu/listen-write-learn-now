
-- Create table for reading exercises
CREATE TABLE public.reading_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  target_length INTEGER NOT NULL DEFAULT 100,
  grammar_focus TEXT,
  topic TEXT NOT NULL,
  content JSONB NOT NULL, -- Will store sentences array with analysis
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived BOOLEAN DEFAULT false
);

-- Create table for reading exercise sentences (for detailed tracking)
CREATE TABLE public.reading_exercise_sentences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reading_exercise_id UUID NOT NULL REFERENCES public.reading_exercises(id) ON DELETE CASCADE,
  sentence_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  audio_url TEXT,
  analysis JSONB, -- Grammar analysis, word definitions, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for reading exercise progress
CREATE TABLE public.reading_exercise_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reading_exercise_id UUID NOT NULL REFERENCES public.reading_exercises(id) ON DELETE CASCADE,
  sentences_completed INTEGER DEFAULT 0,
  total_sentences INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  last_sentence_index INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reading_exercise_id)
);

-- Enable RLS on all tables
ALTER TABLE public.reading_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_exercise_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_exercise_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reading_exercises
CREATE POLICY "Users can view their own reading exercises" 
  ON public.reading_exercises 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading exercises" 
  ON public.reading_exercises 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading exercises" 
  ON public.reading_exercises 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading exercises" 
  ON public.reading_exercises 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for reading_exercise_sentences
CREATE POLICY "Users can view sentences of their reading exercises" 
  ON public.reading_exercise_sentences 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.reading_exercises re 
    WHERE re.id = reading_exercise_sentences.reading_exercise_id 
    AND re.user_id = auth.uid()
  ));

CREATE POLICY "Users can create sentences for their reading exercises" 
  ON public.reading_exercise_sentences 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.reading_exercises re 
    WHERE re.id = reading_exercise_sentences.reading_exercise_id 
    AND re.user_id = auth.uid()
  ));

CREATE POLICY "Users can update sentences of their reading exercises" 
  ON public.reading_exercise_sentences 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.reading_exercises re 
    WHERE re.id = reading_exercise_sentences.reading_exercise_id 
    AND re.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sentences of their reading exercises" 
  ON public.reading_exercise_sentences 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.reading_exercises re 
    WHERE re.id = reading_exercise_sentences.reading_exercise_id 
    AND re.user_id = auth.uid()
  ));

-- Create RLS policies for reading_exercise_progress
CREATE POLICY "Users can view their own reading exercise progress" 
  ON public.reading_exercise_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading exercise progress" 
  ON public.reading_exercise_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading exercise progress" 
  ON public.reading_exercise_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading exercise progress" 
  ON public.reading_exercise_progress 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_reading_exercises_user_id ON public.reading_exercises(user_id);
CREATE INDEX idx_reading_exercises_language ON public.reading_exercises(language);
CREATE INDEX idx_reading_exercise_sentences_reading_exercise_id ON public.reading_exercise_sentences(reading_exercise_id);
CREATE INDEX idx_reading_exercise_progress_user_id ON public.reading_exercise_progress(user_id);
CREATE INDEX idx_reading_exercise_progress_reading_exercise_id ON public.reading_exercise_progress(reading_exercise_id);

-- Create function to update reading exercise progress
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
  -- Get total sentences count
  SELECT COUNT(*) INTO total_sentences_count
  FROM public.reading_exercise_sentences
  WHERE reading_exercise_id = exercise_id_param;
  
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
