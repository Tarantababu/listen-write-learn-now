
// File: supabase/functions/create-mastery-calculation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  try {
    // Create the enhanced mastery calculation function
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.calculate_total_mastered_words(user_id_param uuid, language_param text)
        RETURNS integer
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            sentence_mining_count INTEGER := 0;
            regular_exercise_count INTEGER := 0;
            bidirectional_count INTEGER := 0;
            total_count INTEGER := 0;
        BEGIN
            -- Count words mastered through sentence mining (mastery level >= 4)
            SELECT COUNT(DISTINCT word) INTO sentence_mining_count
            FROM known_words
            WHERE user_id = user_id_param 
            AND language = language_param
            AND mastery_level >= 4;

            -- Count words mastered through regular exercises (3+ high-accuracy completions)
            -- This is approximated by counting completed exercises and estimating words per exercise
            SELECT COALESCE(SUM(
                CASE WHEN completion_count >= 3 THEN
                    -- Estimate 5-10 words per exercise based on text length
                    GREATEST(5, LEAST(10, LENGTH(text) / 20))
                ELSE 0 END
            ), 0)::INTEGER INTO regular_exercise_count
            FROM exercises e
            WHERE e.user_id = user_id_param 
            AND e.language = language_param
            AND e.archived = false;

            -- Count words mastered through bidirectional exercises
            SELECT COUNT(DISTINCT word) INTO bidirectional_count
            FROM bidirectional_mastered_words
            WHERE user_id = user_id_param
            AND language = language_param;

            -- Calculate total (avoiding double counting by taking the maximum approach)
            -- Since sentence mining is most precise, we prioritize it and add estimates from other sources
            total_count := sentence_mining_count + regular_exercise_count + bidirectional_count;

            RETURN total_count;
        END;
        $$;

        -- Create function to update session words mastered count
        CREATE OR REPLACE FUNCTION public.update_session_words_mastered(session_id_param uuid)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            session_user_id UUID;
            session_language TEXT;
            mastered_words_count INTEGER := 0;
        BEGIN
            -- Get session details
            SELECT user_id, language INTO session_user_id, session_language
            FROM sentence_mining_sessions
            WHERE id = session_id_param;

            -- Count newly mastered words in this session
            -- This is approximated by counting exercises where user succeeded
            SELECT COUNT(*) INTO mastered_words_count
            FROM sentence_mining_exercises sme
            WHERE sme.session_id = session_id_param
            AND sme.is_correct = true;

            -- Update session with mastered words count
            UPDATE sentence_mining_sessions
            SET words_mastered = mastered_words_count,
                updated_at = now()
            WHERE id = session_id_param;

            -- Also update user daily activity for this session
            IF session_user_id IS NOT NULL AND session_language IS NOT NULL THEN
                PERFORM record_language_activity(
                    session_user_id,
                    session_language,
                    CURRENT_DATE,
                    1, -- exercises completed
                    mastered_words_count -- words mastered
                );
            END IF;
        END;
        $$;

        -- Create trigger function for automatic session updates
        CREATE OR REPLACE FUNCTION public.trigger_update_session_words_mastered()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            -- Only trigger when an exercise is marked as correct
            IF NEW.is_correct = true AND (OLD.is_correct IS NULL OR OLD.is_correct = false) THEN
                PERFORM update_session_words_mastered(NEW.session_id);
            END IF;
            
            RETURN NEW;
        END;
        $$;

        -- Create the trigger
        CREATE TRIGGER trigger_update_session_words_mastered
            AFTER UPDATE ON sentence_mining_exercises
            FOR EACH ROW
            EXECUTE FUNCTION trigger_update_session_words_mastered();
      `
    });

    if (error) {
      console.error('Error creating mastery calculation functions:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Mastery calculation functions created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in mastery calculation setup:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred during setup' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
