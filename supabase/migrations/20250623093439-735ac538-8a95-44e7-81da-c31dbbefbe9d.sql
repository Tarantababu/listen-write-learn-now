
-- Create shadowing_exercises table
CREATE TABLE public.shadowing_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  source_type TEXT NOT NULL CHECK (source_type IN ('reading_exercise', 'custom_text')),
  source_reading_exercise_id UUID NULL,
  custom_text TEXT NULL,
  sentences JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived BOOLEAN DEFAULT false,
  CONSTRAINT shadowing_exercises_source_check CHECK (
    (source_type = 'reading_exercise' AND source_reading_exercise_id IS NOT NULL AND custom_text IS NULL) OR
    (source_type = 'custom_text' AND custom_text IS NOT NULL AND source_reading_exercise_id IS NULL)
  )
);

-- Create shadowing_progress table
CREATE TABLE public.shadowing_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shadowing_exercise_id UUID NOT NULL REFERENCES public.shadowing_exercises(id) ON DELETE CASCADE,
  current_sentence_index INTEGER NOT NULL DEFAULT 0,
  completed_sentences INTEGER NOT NULL DEFAULT 0,
  total_sentences INTEGER NOT NULL DEFAULT 0,
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, shadowing_exercise_id)
);

-- Create shadowing_recordings table
CREATE TABLE public.shadowing_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shadowing_exercise_id UUID NOT NULL REFERENCES public.shadowing_exercises(id) ON DELETE CASCADE,
  sentence_index INTEGER NOT NULL,
  recording_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for shadowing_exercises
ALTER TABLE public.shadowing_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shadowing exercises" 
  ON public.shadowing_exercises 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shadowing exercises" 
  ON public.shadowing_exercises 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shadowing exercises" 
  ON public.shadowing_exercises 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shadowing exercises" 
  ON public.shadowing_exercises 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for shadowing_progress
ALTER TABLE public.shadowing_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shadowing progress" 
  ON public.shadowing_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shadowing progress" 
  ON public.shadowing_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shadowing progress" 
  ON public.shadowing_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add RLS policies for shadowing_recordings
ALTER TABLE public.shadowing_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shadowing recordings" 
  ON public.shadowing_recordings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shadowing recordings" 
  ON public.shadowing_recordings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shadowing recordings" 
  ON public.shadowing_recordings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update shadowing progress
CREATE OR REPLACE FUNCTION public.update_shadowing_progress(
  exercise_id_param UUID,
  user_id_param UUID,
  sentence_index_param INTEGER,
  total_sentences_param INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_percent DECIMAL(5,2);
BEGIN
  -- Calculate completion percentage
  completion_percent := (sentence_index_param::DECIMAL / total_sentences_param::DECIMAL) * 100;
  
  -- Insert or update progress
  INSERT INTO public.shadowing_progress (
    user_id,
    shadowing_exercise_id,
    current_sentence_index,
    completed_sentences,
    total_sentences,
    completion_percentage,
    last_practiced_at
  )
  VALUES (
    user_id_param,
    exercise_id_param,
    sentence_index_param,
    sentence_index_param,
    total_sentences_param,
    completion_percent,
    now()
  )
  ON CONFLICT (user_id, shadowing_exercise_id)
  DO UPDATE SET
    current_sentence_index = sentence_index_param,
    completed_sentences = sentence_index_param,
    total_sentences = total_sentences_param,
    completion_percentage = completion_percent,
    last_practiced_at = now(),
    updated_at = now();
END;
$$;
