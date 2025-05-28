
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FirstExerciseEmailRequest {
  email: string;
  name?: string;
}

const getFirstExerciseEmailHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>First Exercise Completed! | lwlnow</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.5;
            color: #334155;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: #fff;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .logo-container {
            text-align: center;
            margin-bottom: 24px;
        }
        .logo {
            height: 42px;
            width: auto;
        }
        .header {
            margin-bottom: 24px;
            text-align: center;
        }
        h1 {
            font-size: 22px;
            font-weight: 600;
            margin: 16px 0 8px;
            background: linear-gradient(to right, #8b5cf6, #3b82f6);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        .description {
            color: #64748b;
            font-size: 14px;
        }
        .celebration-card {
            background-color: #f5f3ff;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
            border: 1px solid #ede9fe;
        }
        .celebration-icon {
            font-size: 48px;
            margin-bottom: 16px;
            color: #8b5cf6;
        }
        .milestone-message {
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 16px;
        }
        .continue-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #8b5cf6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            margin-top: 16px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .continue-button:hover {
            background-color: #7c3aed;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .encouragement {
            font-size: 13px;
            color: #64748b;
            margin-top: 16px;
        }
        .footer {
            margin-top: 32px;
            font-size: 12px;
            color: #64748b;
            text-align: center;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <img src="https://resend-attachments.s3.amazonaws.com/9GWwi8jTjTbC41o" alt="lwlnow" class="logo">
        </div>
        
        <div class="header">
            <h1>First Exercise Complete! ✨</h1>
            <p class="description">Your language journey has officially begun</p>
        </div>
        
        <div class="celebration-card">
            <div class="celebration-icon">★</div>
            <p class="milestone-message">
                Amazing first step! This is where every fluent speaker started. 
                You've overcome the hardest part - getting started.
            </p>
            <a href="https://www.lwlnow.com/dashboard/curriculum?tab=in-progress" class="continue-button">Do Another Exercise</a>
            <p class="encouragement">Try to complete 2 more this week to build momentum</p>
        </div>
        
        <div class="footer">
            <p>We're excited to see your progress! The lwlnow team</p>
            <p style="margin-top: 8px;">© 2025 lwlnow.com · Language learning made simple</p>
        </div>
    </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: FirstExerciseEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending first exercise completion email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "support@marketing.lwlnow.com",
      to: [email],
      subject: "You did it! First exercise complete ★",
      html: getFirstExerciseEmailHTML(),
    });

    console.log("First exercise completion email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-first-exercise-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send first exercise completion email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
