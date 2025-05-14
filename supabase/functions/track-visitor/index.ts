
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCorsOptions, applyCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type VisitorPayload = {
  visitorId: string;
  page: string;
  referer?: string | null;
  userAgent?: string;
};

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;
  
  try {
    const { visitorId, page, referer, userAgent } = await req.json() as VisitorPayload;
    
    // Create a Supabase client with the project details
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Insert the visitor tracking data
    const { data, error } = await supabaseAdmin
      .from('visitor_tracking')
      .insert([
        { 
          visitor_id: visitorId,
          page,
          referer,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        }
      ]);
    
    if (error) {
      console.error('Error inserting visitor data:', error);
      
      // Return error response with CORS headers
      return applyCorsHeaders(new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ));
    }
    
    // Return success response with CORS headers
    return applyCorsHeaders(new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ));
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Return error response with CORS headers
    return applyCorsHeaders(new Response(
      JSON.stringify({ success: false, error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    ));
  }
});
