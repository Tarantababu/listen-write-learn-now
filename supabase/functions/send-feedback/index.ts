
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

    // Send notification email to admin
    const emailSubject = "New Feedback Submission";
    const emailContent = `
      <html>
        <body>
          <h2>New Feedback Received</h2>
          <p><strong>From:</strong> ${name || 'Anonymous'}</p>
          <p><strong>Email:</strong> ${email || 'No email provided'}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </body>
      </html>
    `;

    // Send email using Supabase Admin Email API
    const { data: emailData, error: emailError } = await supabaseClient.auth.admin.sendEmail({
      email: ADMIN_EMAIL,
      subject: emailSubject,
      html: emailContent
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Feedback sent successfully to", ADMIN_EMAIL);
    
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
