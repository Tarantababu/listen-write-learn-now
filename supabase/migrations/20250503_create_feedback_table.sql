
-- Create feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE
);

-- Set up RLS policies for the feedback table
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Only allow feedback to be created by authenticated users and not modified
CREATE POLICY "Allow authenticated users to create feedback" 
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only allow admins to view feedback
CREATE POLICY "Only admins can view feedback" 
  ON public.feedback FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'yigitaydin@gmail.com'
  ));

-- Grant permissions
GRANT ALL ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
