
-- Function to get onboarding steps safely without type errors
CREATE OR REPLACE FUNCTION public.get_onboarding_steps()
RETURNS SETOF json AS $$
BEGIN
    RETURN QUERY EXECUTE '
        SELECT json_agg(t)
        FROM (
            SELECT * 
            FROM public.onboarding_steps 
            ORDER BY order_index ASC
        ) t';
END;
$$ LANGUAGE plpgsql;

-- Function to get user onboarding progress
CREATE OR REPLACE FUNCTION public.get_user_onboarding_progress(user_id_param UUID)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    EXECUTE '
        SELECT row_to_json(t)
        FROM (
            SELECT *
            FROM public.user_onboarding_progress
            WHERE user_id = $1
            LIMIT 1
        ) t'
    INTO result
    USING user_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user onboarding progress
CREATE OR REPLACE FUNCTION public.create_onboarding_progress(user_id_param UUID)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    EXECUTE '
        INSERT INTO public.user_onboarding_progress (user_id)
        VALUES ($1)
        RETURNING row_to_json(user_onboarding_progress.*)'
    INTO result
    USING user_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user onboarding progress
CREATE OR REPLACE FUNCTION public.update_onboarding_progress(
    user_id_param UUID,
    updates_param jsonb
)
RETURNS void AS $$
BEGIN
    EXECUTE '
        UPDATE public.user_onboarding_progress
        SET 
            completed_onboarding = COALESCE($2->''completed_onboarding'', completed_onboarding),
            last_step_seen = COALESCE(($2->''last_step_seen'')::int, last_step_seen),
            dismissed_until = CASE 
                WHEN $2->''dismissed_until'' IS NULL THEN NULL 
                ELSE ($2->''dismissed_until'')::timestamp with time zone 
            END,
            updated_at = now()
        WHERE user_id = $1'
    USING user_id_param, updates_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
