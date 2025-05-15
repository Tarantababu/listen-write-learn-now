
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

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
    // Check if request is authorized (user is an admin)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get the user's JWT from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate the JWT and get user info
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the user is an admin
    const { data: adminData, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (adminError || !adminData) {
      console.error("Admin check error:", adminError);
      return new Response(
        JSON.stringify({ error: 'Not an admin user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Admin user authenticated:", user.email);
    
    // Get total users count
    const { count: totalUsersCount, error: totalUsersError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (totalUsersError) {
      console.error("Error counting users:", totalUsersError);
      throw totalUsersError;
    }
    
    // Get subscribed users count
    const { count: subscribedUsersCount, error: subscribedUsersError } = await supabaseClient
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed', true);
    
    if (subscribedUsersError) {
      console.error("Error counting subscribers:", subscribedUsersError);
      throw subscribedUsersError;
    }
    
    // Get subscribe button clicks
    // For now, we'll return a simulated value until we set up proper tracking
    let subscribeButtonClicks = 0;
    
    // First check if the button_clicks table exists by checking for its schema information
    try {
      const { data: schema } = await supabaseClient
        .rpc('get_schema_info', { schema_name: 'public', table_name: 'button_clicks' });
        
      if (schema && schema.length > 0) {
        // If table exists, try to get the click count
        const { data, error } = await supabaseClient.rpc('get_subscribe_clicks');
        if (!error && data !== null) {
          subscribeButtonClicks = data;
        }
      } else {
        console.log("Button clicks table doesn't exist yet");
      }
    } catch (err) {
      console.warn("Error checking button clicks:", err);
      // Continue with default value of 0
    }
    
    // Return the data
    const responseData = {
      totalUsers: totalUsersCount || 0,
      subscribedUsers: subscribedUsersCount || 0,
      subscribeButtonClicks: subscribeButtonClicks,
      timestamp: new Date().toISOString()
    };
    
    console.log("Admin stats retrieved successfully:", responseData);
    
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in admin stats function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
