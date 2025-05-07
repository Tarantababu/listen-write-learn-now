
// File: supabase/functions/apply-migrations/index.ts
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
    
    // Create increment_reading_analyses function if it doesn't exist
    const { data: analysesIncrementExists, error: analysesCheckError } = await supabaseAdmin
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'increment_reading_analyses')
      .maybeSingle();

    if (analysesCheckError) {
      console.error("Error checking for increment_reading_analyses function:", analysesCheckError);
    }
    
    if (!analysesIncrementExists) {
      // Execute the SQL to create the function
      const { error: createError } = await supabaseAdmin.rpc('increment_reading_analyses');
      if (createError) {
        console.error("Error creating increment_reading_analyses function:", createError);
      } else {
        console.log("Created increment_reading_analyses function successfully");
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
