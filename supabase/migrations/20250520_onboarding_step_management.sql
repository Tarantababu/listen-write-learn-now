
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
