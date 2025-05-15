
-- Create tables for roadmaps
CREATE TABLE IF NOT EXISTS "public"."roadmaps" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "created_by" UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS "public"."roadmap_languages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "roadmap_id" UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  "language" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."roadmap_nodes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "roadmap_id" UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "position" INTEGER NOT NULL,
  "is_bonus" BOOLEAN NOT NULL DEFAULT false,
  "default_exercise_id" UUID REFERENCES public.default_exercises(id),
  "language" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."user_roadmaps" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "roadmap_id" UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  "language" TEXT NOT NULL,
  "current_node_id" UUID REFERENCES public.roadmap_nodes(id),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."roadmap_progress" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "roadmap_id" UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  "node_id" UUID NOT NULL REFERENCES public.roadmap_nodes(id) ON DELETE CASCADE,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."roadmap_nodes_progress" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "roadmap_id" UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  "node_id" UUID NOT NULL REFERENCES public.roadmap_nodes(id) ON DELETE CASCADE,
  "language" TEXT NOT NULL,
  "completion_count" INTEGER NOT NULL DEFAULT 0,
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "last_practiced_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, node_id, language)
);

-- Create functions for roadmap operations
CREATE OR REPLACE FUNCTION public.get_roadmaps_by_language(requested_language TEXT)
RETURNS SETOF roadmaps
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT r.* FROM roadmaps r
  WHERE EXISTS (
    SELECT 1 FROM roadmap_languages rl
    WHERE rl.roadmap_id = r.id
    AND rl.language = requested_language
  )
  ORDER BY r.level;
$$;

CREATE OR REPLACE FUNCTION public.get_user_roadmaps_by_language(user_id_param UUID, requested_language TEXT)
RETURNS SETOF user_roadmaps
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM user_roadmaps
  WHERE user_id = user_id_param
  AND language = requested_language
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.increment_node_completion(node_id_param UUID, user_id_param UUID, language_param TEXT, roadmap_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Insert or update the node progress record
  INSERT INTO public.roadmap_nodes_progress (
    user_id, 
    roadmap_id,
    node_id,
    language,
    completion_count,
    last_practiced_at,
    is_completed
  )
  VALUES (
    user_id_param,
    roadmap_id_param,
    node_id_param,
    language_param,
    1,
    now(),
    false
  )
  ON CONFLICT (user_id, node_id, language) 
  DO UPDATE SET
    completion_count = public.roadmap_nodes_progress.completion_count + 1,
    last_practiced_at = now(),
    updated_at = now()
  RETURNING completion_count INTO new_count;
  
  -- If completion count is 3 or more, mark as completed
  IF new_count >= 3 THEN
    UPDATE public.roadmap_nodes_progress
    SET is_completed = true
    WHERE user_id = user_id_param 
    AND node_id = node_id_param
    AND language = language_param;
    
    -- Also update the roadmap_progress table to maintain compatibility
    INSERT INTO public.roadmap_progress (
      user_id, 
      roadmap_id, 
      node_id, 
      completed, 
      completed_at
    )
    VALUES (
      user_id_param,
      roadmap_id_param,
      node_id_param,
      true,
      now()
    )
    ON CONFLICT (user_id, roadmap_id, node_id) 
    DO UPDATE SET
      completed = true,
      completed_at = now(),
      updated_at = now();
  END IF;
END;
$$;
