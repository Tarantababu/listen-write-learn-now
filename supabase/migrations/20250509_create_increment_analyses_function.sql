
-- Create a function specifically for incrementing reading analyses count
CREATE OR REPLACE FUNCTION public.increment_reading_analyses()
RETURNS integer
LANGUAGE sql
AS $$
  SELECT COALESCE(reading_analyses_count, 0) + 1;
$$;

-- Create a function specifically for incrementing reading analyses count
CREATE OR REPLACE FUNCTION public.increment_reading_analyses_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET reading_analyses_count = reading_analyses_count + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;
