
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
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Creating Resend contact for: ${email}`);
    console.log(`First name: ${firstName || 'null'}, Last name: ${lastName || 'null'}`);

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
    console.error("Error details:", error.message, error.stack);
    
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
