
-- Create the audio storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio', 
  'audio', 
  true, 
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the audio bucket
CREATE POLICY "Public audio access" ON storage.objects
FOR SELECT USING (bucket_id = 'audio');

CREATE POLICY "Authenticated users can upload audio" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their audio" ON storage.objects
FOR UPDATE USING (bucket_id = 'audio' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their audio" ON storage.objects
FOR DELETE USING (bucket_id = 'audio' AND auth.role() = 'authenticated');

-- Add metadata column to reading_exercises to track audio generation details
ALTER TABLE public.reading_exercises 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for audio generation status queries for better performance
CREATE INDEX IF NOT EXISTS idx_reading_exercises_audio_generation_status 
ON public.reading_exercises(audio_generation_status) 
WHERE audio_generation_status IN ('pending', 'generating');
