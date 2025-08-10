
-- Create table for anticipation lessons
CREATE TABLE public.anticipation_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  conversation_theme TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  audio_urls JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived BOOLEAN DEFAULT false
);

-- Create table for tracking anticipation lesson progress
CREATE TABLE public.anticipation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lesson_id UUID REFERENCES public.anticipation_lessons(id) ON DELETE CASCADE NOT NULL,
  current_section INTEGER NOT NULL DEFAULT 0,
  sections_completed INTEGER NOT NULL DEFAULT 0,
  total_sections INTEGER NOT NULL DEFAULT 8,
  anticipation_accuracy NUMERIC(5,2) DEFAULT 0.00,
  completion_percentage NUMERIC(5,2) DEFAULT 0.00,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS on anticipation_lessons table
ALTER TABLE public.anticipation_lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anticipation_lessons
CREATE POLICY "Users can create their own anticipation lessons" 
  ON public.anticipation_lessons 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own anticipation lessons" 
  ON public.anticipation_lessons 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own anticipation lessons" 
  ON public.anticipation_lessons 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anticipation lessons" 
  ON public.anticipation_lessons 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS on anticipation_progress table
ALTER TABLE public.anticipation_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anticipation_progress
CREATE POLICY "Users can create their own anticipation progress" 
  ON public.anticipation_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own anticipation progress" 
  ON public.anticipation_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own anticipation progress" 
  ON public.anticipation_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anticipation progress" 
  ON public.anticipation_progress 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update progress when lesson sections are completed
CREATE OR REPLACE FUNCTION public.update_anticipation_progress(
  lesson_id_param UUID,
  user_id_param UUID,
  section_index_param INTEGER,
  total_sections_param INTEGER,
  accuracy_param NUMERIC DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_percent DECIMAL(5,2);
BEGIN
  -- Calculate completion percentage
  completion_percent := (section_index_param::DECIMAL / total_sections_param::DECIMAL) * 100;
  
  -- Insert or update progress
  INSERT INTO public.anticipation_progress (
    user_id,
    lesson_id,
    current_section,
    sections_completed,
    total_sections,
    anticipation_accuracy,
    completion_percentage,
    last_practiced_at
  )
  VALUES (
    user_id_param,
    lesson_id_param,
    section_index_param,
    section_index_param,
    total_sections_param,
    COALESCE(accuracy_param, 0.00),
    completion_percent,
    now()
  )
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    current_section = section_index_param,
    sections_completed = GREATEST(anticipation_progress.sections_completed, section_index_param),
    total_sections = total_sections_param,
    anticipation_accuracy = COALESCE(accuracy_param, anticipation_progress.anticipation_accuracy),
    completion_percentage = completion_percent,
    last_practiced_at = now(),
    updated_at = now(),
    completed_at = CASE 
      WHEN completion_percent >= 100 THEN now()
      ELSE anticipation_progress.completed_at
    END;
END;
$$;

-- Add updated_at trigger for anticipation_lessons
CREATE TRIGGER update_anticipation_lessons_updated_at
  BEFORE UPDATE ON public.anticipation_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for anticipation_progress  
CREATE TRIGGER update_anticipation_progress_updated_at
  BEFORE UPDATE ON public.anticipation_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
