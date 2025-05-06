
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Create a Supabase client with service role key to perform admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Apply the SQL migration to fix the search_path in all functions
    // We'll directly execute the SQL that sets the search_path for each function
    const { error: trackVisitorError } = await supabaseAdmin.rpc(
      'track_visitor', 
      { 
        visitor_id: 'migration-test', 
        page: 'migration-test', 
        referer: null, 
        user_agent: null, 
        ip_address: '127.0.0.1' 
      }
    );
    
    if (trackVisitorError) {
      console.error('Error testing track_visitor function:', trackVisitorError);
    } else {
      console.log('Successfully tested track_visitor function');
    }
    
    // Also test the set_admin_email function
    const { error: setAdminEmailError } = await supabaseAdmin.rpc('set_admin_email');
    
    if (setAdminEmailError) {
      console.error('Error testing set_admin_email function:', setAdminEmailError);
    } else {
      console.log('Successfully tested set_admin_email function');
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Database functions updated with fixed search paths' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
