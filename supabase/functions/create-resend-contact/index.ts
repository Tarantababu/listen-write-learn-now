
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateContactRequest {
  email: string;
  firstName?: string;
  lastName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName }: CreateContactRequest = await req.json();

    if (!email) {
      console.error("Email is required but not provided");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Creating Resend contact for: ${email}`);
    console.log(`First name: ${firstName || 'not provided'}, Last name: ${lastName || 'not provided'}`);

    // Check if resend.contacts exists
    if (!resend.contacts) {
      console.error("Resend contacts API not available");
      return new Response(
        JSON.stringify({ error: "Resend contacts API not available" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if Resend API key is configured
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error("RESEND_API_KEY environment variable not set");
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const contactPayload = {
      email: email,
      firstName: firstName || null,
      lastName: lastName || null,
      unsubscribed: false,
      audienceId: '96edb5a4-ab84-49e3-b7c8-e034961d281a',
    };

    console.log("Contact payload:", JSON.stringify(contactPayload));

    const contactResponse = await resend.contacts.create(contactPayload);

    console.log("Resend contact created successfully:", contactResponse);

    return new Response(JSON.stringify({ success: true, data: contactResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in create-resend-contact function:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    
    // Handle specific Resend API errors
    if (error.message && error.message.includes('Invalid API key')) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid Resend API key",
          details: "Please check your Resend API key configuration"
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (error.message && error.message.includes('audience')) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid audience ID",
          details: "The specified audience ID is not valid"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to create Resend contact",
        details: error.stack || "No stack trace available"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
