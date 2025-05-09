
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
  
  // Extract request details
  const url = new URL(req.url);
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  try {
    // Add missing RPC functions
    await supabaseAdmin.rpc('set_admin_email');

    // Create increment function if it doesn't exist
    const { data: functionExists, error: checkError } = await supabaseAdmin
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'increment')
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for increment function:", checkError);
    }
    
    if (!functionExists) {
      const { error } = await supabaseAdmin.rpc('create_increment_function');
      if (error) {
        console.error("Error creating increment function:", error);
      } else {
        console.log("Created increment function successfully");
      }
    }
    
    // Check if increment_reading_analyses function exists
    const { data: analysesIncrementExists, error: analysesCheckError } = await supabaseAdmin
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'increment_reading_analyses')
      .maybeSingle();

    if (analysesCheckError) {
      console.error("Error checking for increment_reading_analyses function:", analysesCheckError);
    }
    
    // If increment_reading_analyses doesn't exist, create it using SQL directly
    if (!analysesIncrementExists) {
      // Execute SQL directly to create the function
      const sql = `
        CREATE OR REPLACE FUNCTION public.increment_reading_analyses()
        RETURNS integer
        LANGUAGE sql
        AS $$
          SELECT COALESCE(reading_analyses_count, 0) + 1;
        $$;
      `;
      
      const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { sql });
      
      if (sqlError) {
        console.error("Error creating increment_reading_analyses function:", sqlError);
      } else {
        console.log("Created increment_reading_analyses function successfully");
      }
    }

    // Create function to get next roadmap node for user
    const { data: nextNodeExists, error: nextNodeCheckError } = await supabaseAdmin
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'get_next_roadmap_node')
      .maybeSingle();

    if (nextNodeCheckError) {
      console.error("Error checking for get_next_roadmap_node function:", nextNodeCheckError);
    }
    
    if (!nextNodeExists) {
      const sql = `
        CREATE OR REPLACE FUNCTION public.get_next_roadmap_node(roadmap_id_param uuid, current_position_param integer)
        RETURNS uuid
        LANGUAGE plpgsql
        AS $$
        DECLARE
          next_node_id uuid;
        BEGIN
          SELECT id INTO next_node_id
          FROM roadmap_nodes
          WHERE roadmap_id = roadmap_id_param AND position = current_position_param + 1
          ORDER BY position
          LIMIT 1;
          
          RETURN next_node_id;
        END;
        $$;
      `;
      
      const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { sql });
      
      if (sqlError) {
        console.error("Error creating get_next_roadmap_node function:", sqlError);
      } else {
        console.log("Created get_next_roadmap_node function successfully");
      }
    }

    // Create function to check if a node is unlocked for a user
    const { data: isNodeUnlockedExists, error: isNodeUnlockedCheckError } = await supabaseAdmin
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'is_node_unlocked')
      .maybeSingle();

    if (isNodeUnlockedCheckError) {
      console.error("Error checking for is_node_unlocked function:", isNodeUnlockedCheckError);
    }
    
    if (!isNodeUnlockedExists) {
      const sql = `
        CREATE OR REPLACE FUNCTION public.is_node_unlocked(user_id_param uuid, node_id_param uuid)
        RETURNS boolean
        LANGUAGE plpgsql
        AS $$
        DECLARE
          current_node roadmap_nodes;
          roadmap_id_var uuid;
          node_position integer;
          highest_completed_position integer;
        BEGIN
          -- Get the current node details
          SELECT * INTO current_node
          FROM roadmap_nodes
          WHERE id = node_id_param;
          
          IF NOT FOUND THEN
            RETURN false;
          END IF;
          
          roadmap_id_var := current_node.roadmap_id;
          node_position := current_node.position;
          
          -- If it's the first node, it's always unlocked
          IF node_position = 1 THEN
            RETURN true;
          END IF;
          
          -- Check if the previous node in sequence is completed
          SELECT MAX(rn.position) INTO highest_completed_position
          FROM roadmap_progress rp
          JOIN roadmap_nodes rn ON rp.node_id = rn.id
          WHERE rp.user_id = user_id_param
            AND rn.roadmap_id = roadmap_id_var
            AND rp.completed = true;
            
          RETURN (highest_completed_position IS NOT NULL AND highest_completed_position >= node_position - 1);
        END;
        $$;
      `;
      
      const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { sql });
      
      if (sqlError) {
        console.error("Error creating is_node_unlocked function:", sqlError);
      } else {
        console.log("Created is_node_unlocked function successfully");
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Applied database migrations successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error applying migrations:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred during migration' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
