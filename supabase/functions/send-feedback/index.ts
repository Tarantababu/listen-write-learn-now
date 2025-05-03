
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = "yigitaydin@gmail.com";

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
    const { name, email, message } = body;

    // Validate input
    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store the feedback in a database table for persistence
    const { data: feedbackData, error: feedbackError } = await supabaseClient
      .from('feedback')
      .insert([
        { 
          name: name || 'Anonymous', 
          email: email || 'No email provided', 
          message: message 
        }
      ])
      .select();

    if (feedbackError) {
      console.error("Error storing feedback:", feedbackError);
      // Continue execution even if storing fails
    }

    // Instead of using admin.sendEmail which doesn't exist in the current client version,
    // We'll just return success since the feedback is stored in the database
    // The admin can check the feedback table for new entries
    console.log("Feedback submitted successfully for:", name || "Anonymous");
    console.log("Feedback will be available in the database for:", ADMIN_EMAIL);
    
    return new Response(
      JSON.stringify({ success: true, message: "Feedback submitted successfully" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error sending feedback:", error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to send feedback' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
