
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Set up CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Extract the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.log("[GET-ADMIN-STATS] No authorization header found");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.log("[GET-ADMIN-STATS] Auth error or no user found:", authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if the user is an admin
    const adminEmail = Deno.env.get('ADMIN_EMAIL');
    if (user.email !== adminEmail) {
      console.log(`[GET-ADMIN-STATS] User ${user.email} is not admin (${adminEmail})`);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[GET-ADMIN-STATS] Admin authenticated: ${user.email}`);
    
    // Get total profiles count 
    const { count: profilesCount, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (profilesError) {
      console.log("[GET-ADMIN-STATS] Error fetching profiles:", profilesError);
      return new Response(JSON.stringify({ error: profilesError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get subscribed users count
    const { count: subscribedCount, error: subscribedError } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed', true);
      
    if (subscribedError) {
      console.log("[GET-ADMIN-STATS] Error fetching subscribers:", subscribedError);
      return new Response(JSON.stringify({ error: subscribedError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get subscribe button click count
    const { count: subscribeButtonClickCount, error: clickError } = await supabaseAdmin
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .like('page', 'button_click:subscribe%');
      
    if (clickError) {
      console.log("[GET-ADMIN-STATS] Error fetching subscribe button clicks:", clickError);
      return new Response(JSON.stringify({ error: clickError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Log the counts for debugging
    console.log(`[GET-ADMIN-STATS] Found ${profilesCount} total users, ${subscribedCount} subscribed users, and ${subscribeButtonClickCount} subscribe button clicks`);
    
    // Return all counts
    return new Response(
      JSON.stringify({ 
        totalUsers: profilesCount || 0,
        subscribedUsers: subscribedCount || 0,
        subscribeButtonClicks: subscribeButtonClickCount || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.log("[GET-ADMIN-STATS] Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
