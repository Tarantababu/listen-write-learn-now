
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const body = await req.json();
    const { name, email, message } = body;

    // Validate input
    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email using Supabase's built-in email service
    // This requires email templates to be set up in the Supabase dashboard
    const { data, error } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: Deno.env.get('ADMIN_EMAIL') || 'your-email@example.com',
      options: {
        data: {
          subject: 'New Feedback Submission',
          feedback_name: name || 'Anonymous',
          feedback_email: email || 'No email provided',
          feedback_message: message
        }
      }
    });

    if (error) {
      throw error;
    }

    console.log("Feedback sent successfully");
    
    return new Response(
      JSON.stringify({ success: true, message: "Feedback sent successfully" }),
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
