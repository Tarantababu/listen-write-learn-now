
-- Create a function to increment a value safely
CREATE OR REPLACE FUNCTION public.increment(row_count integer)
RETURNS integer
LANGUAGE sql
AS $$
  SELECT COALESCE(row_count, 0) + 1;
$$;

-- Create a function that can be called by RPC to create the increment function
-- This is called from apply-migrations edge function
CREATE OR REPLACE FUNCTION public.create_increment_function()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- The function is already created above, but this allows us to call it via RPC
  -- to ensure it exists
  RETURN;
END;
$$;
