
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

-- Function to toggle a step's active status
CREATE OR REPLACE FUNCTION public.toggle_onboarding_step_active(
    step_id UUID,
    is_active BOOLEAN
)
RETURNS void AS $$
BEGIN
    EXECUTE '
        UPDATE public.onboarding_steps
        SET is_active = $2
        WHERE id = $1'
    USING step_id, is_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update an onboarding step
CREATE OR REPLACE FUNCTION public.update_onboarding_step(
    step_id UUID,
    step_data JSONB
)
RETURNS void AS $$
BEGIN
    EXECUTE '
        UPDATE public.onboarding_steps
        SET 
            title = $2->>''title'',
            description = $2->>''description'',
            target_element = $2->>''target_element'',
            position = ($2->>''position'')::text,
            order_index = ($2->>''order_index'')::integer,
            is_active = ($2->>''is_active'')::boolean,
            feature_area = $2->>''feature_area'',
            updated_at = now()
        WHERE id = $1'
    USING step_id, step_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new onboarding step
CREATE OR REPLACE FUNCTION public.create_onboarding_step(
    step_data JSONB
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    EXECUTE '
        INSERT INTO public.onboarding_steps (
            title, 
            description, 
            target_element, 
            position, 
            order_index, 
            is_active, 
            feature_area
        )
        VALUES (
            $1->>''title'',
            $1->>''description'',
            $1->>''target_element'',
            ($1->>''position'')::text,
            ($1->>''order_index'')::integer,
            ($1->>''is_active'')::boolean,
            $1->>''feature_area''
        )
        RETURNING id'
    INTO new_id
    USING step_data;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
