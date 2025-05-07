
-- Create a function specifically for incrementing reading analyses count
CREATE OR REPLACE FUNCTION public.increment_reading_analyses()
RETURNS integer
LANGUAGE sql
AS $$
  SELECT COALESCE(reading_analyses_count, 0) + 1;
$$;

