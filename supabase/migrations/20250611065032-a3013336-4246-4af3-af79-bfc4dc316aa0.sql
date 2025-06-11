
-- Phase 1: Critical RLS Policy Additions (Corrected)

-- Enable RLS on tables that don't have it yet (ignore if already enabled)
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN
    -- Table might already have RLS enabled
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.admin_uploads ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.default_exercises ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  -- Admin messages policies
  DROP POLICY IF EXISTS "Only admins can view admin messages" ON public.admin_messages;
  DROP POLICY IF EXISTS "Only admins can create admin messages" ON public.admin_messages;
  DROP POLICY IF EXISTS "Only admins can update admin messages" ON public.admin_messages;
  DROP POLICY IF EXISTS "Only admins can delete admin messages" ON public.admin_messages;
  
  -- Admin uploads policies
  DROP POLICY IF EXISTS "Only admins can view admin uploads" ON public.admin_uploads;
  DROP POLICY IF EXISTS "Only admins can create admin uploads" ON public.admin_uploads;
  DROP POLICY IF EXISTS "Only admins can update admin uploads" ON public.admin_uploads;
  DROP POLICY IF EXISTS "Only admins can delete admin uploads" ON public.admin_uploads;
  
  -- Blog posts policies
  DROP POLICY IF EXISTS "Everyone can view published blog posts" ON public.blog_posts;
  DROP POLICY IF EXISTS "Only admins can create blog posts" ON public.blog_posts;
  DROP POLICY IF EXISTS "Only admins can update blog posts" ON public.blog_posts;
  DROP POLICY IF EXISTS "Only admins can delete blog posts" ON public.blog_posts;
  
  -- Default exercises policies
  DROP POLICY IF EXISTS "Everyone can view default exercises" ON public.default_exercises;
  DROP POLICY IF EXISTS "Only admins can create default exercises" ON public.default_exercises;
  DROP POLICY IF EXISTS "Only admins can update default exercises" ON public.default_exercises;
  DROP POLICY IF EXISTS "Only admins can delete default exercises" ON public.default_exercises;
  
  -- Promotional banners policies
  DROP POLICY IF EXISTS "Everyone can view active promotional banners" ON public.promotional_banners;
  DROP POLICY IF EXISTS "Only admins can create promotional banners" ON public.promotional_banners;
  DROP POLICY IF EXISTS "Only admins can update promotional banners" ON public.promotional_banners;
  DROP POLICY IF EXISTS "Only admins can delete promotional banners" ON public.promotional_banners;
  
  -- Promo codes policies
  DROP POLICY IF EXISTS "Only admins can view promo codes" ON public.promo_codes;
  DROP POLICY IF EXISTS "Only admins can create promo codes" ON public.promo_codes;
  DROP POLICY IF EXISTS "Only admins can update promo codes" ON public.promo_codes;
  DROP POLICY IF EXISTS "Only admins can delete promo codes" ON public.promo_codes;
  
  -- Promo code usage policies
  DROP POLICY IF EXISTS "Users can view their own promo code usage" ON public.promo_code_usage;
  DROP POLICY IF EXISTS "Only authenticated users can create promo code usage" ON public.promo_code_usage;
  DROP POLICY IF EXISTS "Only admins can update promo code usage" ON public.promo_code_usage;
  
  -- User-specific table policies (only drop if they exist)
  DROP POLICY IF EXISTS "Users can view their own exercises" ON public.exercises;
  DROP POLICY IF EXISTS "Users can create their own exercises" ON public.exercises;
  DROP POLICY IF EXISTS "Users can update their own exercises" ON public.exercises;
  DROP POLICY IF EXISTS "Users can delete their own exercises" ON public.exercises;
  
  DROP POLICY IF EXISTS "Users can view their own directories" ON public.directories;
  DROP POLICY IF EXISTS "Users can create their own directories" ON public.directories;
  DROP POLICY IF EXISTS "Users can update their own directories" ON public.directories;
  DROP POLICY IF EXISTS "Users can delete their own directories" ON public.directories;
  
  DROP POLICY IF EXISTS "Users can view their own bidirectional exercises" ON public.bidirectional_exercises;
  DROP POLICY IF EXISTS "Users can create their own bidirectional exercises" ON public.bidirectional_exercises;
  DROP POLICY IF EXISTS "Users can update their own bidirectional exercises" ON public.bidirectional_exercises;
  DROP POLICY IF EXISTS "Users can delete their own bidirectional exercises" ON public.bidirectional_exercises;
  
  DROP POLICY IF EXISTS "Users can view their own completions" ON public.completions;
  DROP POLICY IF EXISTS "Users can create their own completions" ON public.completions;
  
  DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
  
  DROP POLICY IF EXISTS "Users can view their own vocabulary" ON public.vocabulary;
  DROP POLICY IF EXISTS "Users can create their own vocabulary" ON public.vocabulary;
  DROP POLICY IF EXISTS "Users can update their own vocabulary" ON public.vocabulary;
  DROP POLICY IF EXISTS "Users can delete their own vocabulary" ON public.vocabulary;
END $$;

-- Create comprehensive RLS policies for admin_messages
CREATE POLICY "Only admins can view admin messages" 
  ON public.admin_messages FOR SELECT 
  USING (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can create admin messages" 
  ON public.admin_messages FOR INSERT 
  WITH CHECK (public.has_role('admin'::app_role) AND created_by = auth.uid());

CREATE POLICY "Only admins can update admin messages" 
  ON public.admin_messages FOR UPDATE 
  USING (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can delete admin messages" 
  ON public.admin_messages FOR DELETE 
  USING (public.has_role('admin'::app_role));

-- Create RLS policies for admin_uploads
CREATE POLICY "Only admins can view admin uploads" 
  ON public.admin_uploads FOR SELECT 
  USING (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can create admin uploads" 
  ON public.admin_uploads FOR INSERT 
  WITH CHECK (public.has_role('admin'::app_role) AND uploaded_by = auth.uid());

CREATE POLICY "Only admins can update admin uploads" 
  ON public.admin_uploads FOR UPDATE 
  USING (public.has_role('admin'::app_role) AND uploaded_by = auth.uid());

CREATE POLICY "Only admins can delete admin uploads" 
  ON public.admin_uploads FOR DELETE 
  USING (public.has_role('admin'::app_role) AND uploaded_by = auth.uid());

-- Create RLS policies for blog_posts
CREATE POLICY "Everyone can view published blog posts" 
  ON public.blog_posts FOR SELECT 
  USING (status = 'published' OR public.has_role('admin'::app_role));

CREATE POLICY "Only admins can create blog posts" 
  ON public.blog_posts FOR INSERT 
  WITH CHECK (public.has_role('admin'::app_role) AND author_id = auth.uid());

CREATE POLICY "Only admins can update blog posts" 
  ON public.blog_posts FOR UPDATE 
  USING (public.has_role('admin'::app_role) AND author_id = auth.uid());

CREATE POLICY "Only admins can delete blog posts" 
  ON public.blog_posts FOR DELETE 
  USING (public.has_role('admin'::app_role) AND author_id = auth.uid());

-- Create RLS policies for default_exercises
CREATE POLICY "Everyone can view default exercises" 
  ON public.default_exercises FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can create default exercises" 
  ON public.default_exercises FOR INSERT 
  WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can update default exercises" 
  ON public.default_exercises FOR UPDATE 
  USING (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can delete default exercises" 
  ON public.default_exercises FOR DELETE 
  USING (public.has_role('admin'::app_role));

-- Create RLS policies for promotional_banners
CREATE POLICY "Everyone can view active promotional banners" 
  ON public.promotional_banners FOR SELECT 
  USING (is_active = true OR public.has_role('admin'::app_role));

CREATE POLICY "Only admins can create promotional banners" 
  ON public.promotional_banners FOR INSERT 
  WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can update promotional banners" 
  ON public.promotional_banners FOR UPDATE 
  USING (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can delete promotional banners" 
  ON public.promotional_banners FOR DELETE 
  USING (public.has_role('admin'::app_role));

-- Create RLS policies for promo_codes
CREATE POLICY "Only admins can view promo codes" 
  ON public.promo_codes FOR SELECT 
  USING (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can create promo codes" 
  ON public.promo_codes FOR INSERT 
  WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can update promo codes" 
  ON public.promo_codes FOR UPDATE 
  USING (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can delete promo codes" 
  ON public.promo_codes FOR DELETE 
  USING (public.has_role('admin'::app_role));

-- Create RLS policies for promo_code_usage
CREATE POLICY "Users can view their own promo code usage" 
  ON public.promo_code_usage FOR SELECT 
  USING (user_id = auth.uid() OR public.has_role('admin'::app_role));

CREATE POLICY "Only authenticated users can create promo code usage" 
  ON public.promo_code_usage FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can update promo code usage" 
  ON public.promo_code_usage FOR UPDATE 
  USING (public.has_role('admin'::app_role));

-- Add RLS policies for user-specific tables
CREATE POLICY "Users can view their own exercises" 
  ON public.exercises FOR SELECT 
  USING (user_id = auth.uid() OR public.has_role('admin'::app_role));

CREATE POLICY "Users can create their own exercises" 
  ON public.exercises FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own exercises" 
  ON public.exercises FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own exercises" 
  ON public.exercises FOR DELETE 
  USING (user_id = auth.uid());

-- Add RLS policies for directories
CREATE POLICY "Users can view their own directories" 
  ON public.directories FOR SELECT 
  USING (user_id = auth.uid() OR public.has_role('admin'::app_role));

CREATE POLICY "Users can create their own directories" 
  ON public.directories FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own directories" 
  ON public.directories FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own directories" 
  ON public.directories FOR DELETE 
  USING (user_id = auth.uid());

-- Add RLS policies for bidirectional exercises
CREATE POLICY "Users can view their own bidirectional exercises" 
  ON public.bidirectional_exercises FOR SELECT 
  USING (user_id = auth.uid() OR public.has_role('admin'::app_role));

CREATE POLICY "Users can create their own bidirectional exercises" 
  ON public.bidirectional_exercises FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bidirectional exercises" 
  ON public.bidirectional_exercises FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own bidirectional exercises" 
  ON public.bidirectional_exercises FOR DELETE 
  USING (user_id = auth.uid());

-- Add RLS policies for other user-specific tables
CREATE POLICY "Users can view their own completions" 
  ON public.completions FOR SELECT 
  USING (user_id = auth.uid() OR public.has_role('admin'::app_role));

CREATE POLICY "Users can create their own completions" 
  ON public.completions FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own profiles" 
  ON public.profiles FOR SELECT 
  USING (id = auth.uid() OR public.has_role('admin'::app_role));

CREATE POLICY "Users can update their own profiles" 
  ON public.profiles FOR UPDATE 
  USING (id = auth.uid());

CREATE POLICY "Users can view their own vocabulary" 
  ON public.vocabulary FOR SELECT 
  USING (user_id = auth.uid() OR public.has_role('admin'::app_role));

CREATE POLICY "Users can create their own vocabulary" 
  ON public.vocabulary FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vocabulary" 
  ON public.vocabulary FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own vocabulary" 
  ON public.vocabulary FOR DELETE 
  USING (user_id = auth.uid());

-- Phase 2: Enhanced Security Functions

-- Create a function to validate admin access with better error handling
CREATE OR REPLACE FUNCTION public.validate_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if user has admin role
  IF NOT public.has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  RETURN true;
END;
$$;

-- Create a function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  event_details jsonb DEFAULT NULL,
  user_id_param uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert security event log (we'll create this table if needed)
  INSERT INTO public.security_logs (
    user_id,
    event_type,
    event_details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    user_id_param,
    event_type,
    event_details,
    COALESCE(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', 'unknown'),
    COALESCE(current_setting('request.headers', true)::jsonb->>'user-agent', 'unknown'),
    now()
  );
EXCEPTION
  WHEN others THEN
    -- Fail silently for logging to not break main functionality
    NULL;
END;
$$;

-- Create security logs table for monitoring
CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
DROP POLICY IF EXISTS "Only admins can view security logs" ON public.security_logs;
CREATE POLICY "Only admins can view security logs" 
  ON public.security_logs FOR SELECT 
  USING (public.has_role('admin'::app_role));

-- Phase 3: Input Validation Function
CREATE OR REPLACE FUNCTION public.validate_input(
  input_text text,
  max_length integer DEFAULT 1000,
  allow_html boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if input is null or empty
  IF input_text IS NULL OR length(trim(input_text)) = 0 THEN
    RETURN false;
  END IF;
  
  -- Check length
  IF length(input_text) > max_length THEN
    RETURN false;
  END IF;
  
  -- Check for potential XSS if HTML is not allowed
  IF NOT allow_html AND (
    input_text ~* '<script.*?>.*?</script>' OR
    input_text ~* 'javascript:' OR
    input_text ~* 'on\w+\s*=' OR
    input_text ~* '<iframe' OR
    input_text ~* '<object' OR
    input_text ~* '<embed'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Phase 4: Enhanced visitor tracking with rate limiting
CREATE OR REPLACE FUNCTION public.track_visitor_secure(
  visitor_id_param text, 
  page_param text, 
  referer_param text, 
  user_agent_param text, 
  ip_address_param text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  visitor_uuid UUID;
  anonymized_ip TEXT;
  recent_visits INTEGER;
BEGIN
  -- Validate inputs
  IF NOT public.validate_input(visitor_id_param, 255) OR 
     NOT public.validate_input(page_param, 255) THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;
  
  -- Anonymize IP by removing last octet
  anonymized_ip := regexp_replace(ip_address_param, '(\d+\.\d+\.\d+)\.\d+', '\1.0');
  
  -- Rate limiting: check for too many visits from same IP in last minute
  SELECT COUNT(*) INTO recent_visits
  FROM public.visitors 
  WHERE ip_address = anonymized_ip 
  AND created_at > now() - interval '1 minute';
  
  IF recent_visits > 30 THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;
  
  INSERT INTO public.visitors (visitor_id, page, referer, user_agent, ip_address)
  VALUES (visitor_id_param, page_param, referer_param, user_agent_param, anonymized_ip)
  RETURNING id INTO visitor_uuid;
  
  RETURN visitor_uuid;
END;
$$;

-- Update triggers for security logging
CREATE OR REPLACE FUNCTION public.trigger_security_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log significant events
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME IN ('user_roles', 'admin_messages') THEN
    PERFORM public.log_security_event(
      'admin_action',
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'record_id', NEW.id
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for security monitoring
DROP TRIGGER IF EXISTS security_log_trigger ON public.user_roles;
CREATE TRIGGER security_log_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_security_log();

DROP TRIGGER IF EXISTS admin_messages_security_trigger ON public.admin_messages;
CREATE TRIGGER admin_messages_security_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_messages
  FOR EACH ROW EXECUTE FUNCTION public.trigger_security_log();
