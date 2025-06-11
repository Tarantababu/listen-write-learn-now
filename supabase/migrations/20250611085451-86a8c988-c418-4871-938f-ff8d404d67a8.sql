
-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_free_subscription_limits();

-- Recreate the function with the updated return type including is_premium
CREATE OR REPLACE FUNCTION public.get_free_subscription_limits()
RETURNS TABLE(
  user_id uuid,
  email text,
  exercise_count bigint,
  vocabulary_count bigint,
  bidirectional_count bigint,
  is_premium boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has admin access
  IF NOT public.has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  WITH exercise_counts AS (
    SELECT 
      e.user_id,
      COUNT(*) as exercise_count
    FROM public.exercises e
    WHERE e.archived = false
    GROUP BY e.user_id
    HAVING COUNT(*) >= 3
  ),
  vocabulary_counts AS (
    SELECT 
      v.user_id,
      COUNT(*) as vocabulary_count
    FROM public.vocabulary v
    GROUP BY v.user_id
    HAVING COUNT(*) >= 5
  ),
  bidirectional_counts AS (
    SELECT 
      be.user_id,
      COUNT(*) as bidirectional_count
    FROM public.bidirectional_exercises be
    GROUP BY be.user_id
    HAVING COUNT(*) >= 3
  ),
  all_users AS (
    SELECT user_id FROM exercise_counts
    UNION
    SELECT user_id FROM vocabulary_counts
    UNION
    SELECT user_id FROM bidirectional_counts
  )
  SELECT 
    au.user_id,
    COALESCE(auth_users.email, 'No email') as email,
    COALESCE(ec.exercise_count, 0) as exercise_count,
    COALESCE(vc.vocabulary_count, 0) as vocabulary_count,
    COALESCE(bc.bidirectional_count, 0) as bidirectional_count,
    COALESCE(s.subscribed, false) as is_premium
  FROM all_users au
  LEFT JOIN auth.users auth_users ON auth_users.id = au.user_id
  LEFT JOIN exercise_counts ec ON ec.user_id = au.user_id
  LEFT JOIN vocabulary_counts vc ON vc.user_id = au.user_id
  LEFT JOIN bidirectional_counts bc ON bc.user_id = au.user_id
  LEFT JOIN public.subscribers s ON s.user_id = au.user_id
  ORDER BY auth_users.email;
END;
$$;
