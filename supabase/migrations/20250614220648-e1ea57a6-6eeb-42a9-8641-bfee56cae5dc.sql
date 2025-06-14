
-- Update the generate-reading-content edge function to handle custom text processing
-- First, let's update the reading_exercises table to support pre-generated audio URLs
ALTER TABLE public.reading_exercises 
ADD COLUMN IF NOT EXISTS full_text_audio_url TEXT;

-- Update the reading_exercise_sentences table to ensure audio URLs are properly stored
-- This column already exists, but let's make sure it's properly indexed for performance
CREATE INDEX IF NOT EXISTS idx_reading_exercise_sentences_audio_url 
ON public.reading_exercise_sentences(audio_url) 
WHERE audio_url IS NOT NULL;

-- Add an index on reading_exercises for audio URL lookups
CREATE INDEX IF NOT EXISTS idx_reading_exercises_full_text_audio_url 
ON public.reading_exercises(full_text_audio_url) 
WHERE full_text_audio_url IS NOT NULL;

-- Update the reading_exercises table to track audio generation status
ALTER TABLE public.reading_exercises 
ADD COLUMN IF NOT EXISTS audio_generation_status TEXT DEFAULT 'pending' CHECK (audio_generation_status IN ('pending', 'generating', 'completed', 'failed'));

-- Add index for audio generation status queries
CREATE INDEX IF NOT EXISTS idx_reading_exercises_audio_status 
ON public.reading_exercises(audio_generation_status) 
WHERE audio_generation_status != 'completed';
