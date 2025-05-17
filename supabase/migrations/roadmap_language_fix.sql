
-- Modify the get_roadmaps_by_language function to handle case-insensitive matching
CREATE OR REPLACE FUNCTION public.get_roadmaps_by_language(requested_language text)
 RETURNS SETOF roadmaps
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT r.* FROM roadmaps r
  WHERE EXISTS (
    SELECT 1 FROM roadmap_languages rl
    WHERE rl.roadmap_id = r.id
    AND LOWER(rl.language) = LOWER(requested_language)
  )
  ORDER BY r.level;
$function$;

-- Modify the get_user_roadmaps_by_language function to handle case-insensitive matching
CREATE OR REPLACE FUNCTION public.get_user_roadmaps_by_language(user_id_param uuid, requested_language text)
 RETURNS SETOF user_roadmaps
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT * FROM user_roadmaps
  WHERE user_id = user_id_param
  AND LOWER(language) = LOWER(requested_language)
  ORDER BY created_at DESC;
$function$;
