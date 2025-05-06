
-- Fix function public.track_visitor to have explicit search_path
CREATE OR REPLACE FUNCTION public.track_visitor(visitor_id text, page text, referer text, user_agent text, ip_address text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  visitor_uuid UUID;
  anonymized_ip TEXT;
BEGIN
  -- Anonymize IP by removing last octet
  anonymized_ip := regexp_replace(ip_address, '(\d+\.\d+\.\d+)\.\d+', '\1.0');
  
  INSERT INTO public.visitors (visitor_id, page, referer, user_agent, ip_address)
  VALUES (visitor_id, page, referer, user_agent, anonymized_ip)
  RETURNING id INTO visitor_uuid;
  
  RETURN visitor_uuid;
END;
$function$;

-- Fix function public.set_admin_email to have explicit search_path
CREATE OR REPLACE FUNCTION public.set_admin_email()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  PERFORM set_config('app.admin_email', current_setting('pgrst.claims.email', true), false);
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error setting app.admin_email: %', SQLERRM;
END;
$function$;

-- Fix function public.create_user_message_entries to have explicit search_path
CREATE OR REPLACE FUNCTION public.create_user_message_entries()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  user_record RECORD;
BEGIN
  -- For each user in the system, create a user_message entry
  FOR user_record IN SELECT id FROM auth.users
  LOOP
    INSERT INTO public.user_messages (user_id, message_id)
    VALUES (user_record.id, NEW.id);
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Fix function public.create_profile_for_user to have explicit search_path
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$function$;
