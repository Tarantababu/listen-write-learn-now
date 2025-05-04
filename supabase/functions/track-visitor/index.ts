
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Required environment variables are missing');
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    const { visitorId, page, referer, userAgent } = body;
    
    // Get IP address from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    if (!visitorId || !page) {
      return new Response(
        JSON.stringify({ error: 'Visitor ID and page are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Direct insert instead of using RPC
    const { data, error } = await supabaseClient
      .from('visitors')
      .insert([{
        visitor_id: visitorId,
        page,
        referer: referer || null,
        user_agent: userAgent || null,
        ip_address: ipAddress
      }]);
    
    if (error) {
      console.error("Error tracking visitor:", error);
      throw error;
    }
    
    console.log("Visitor tracked successfully:", visitorId);
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error tracking visitor:", error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to track visitor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
