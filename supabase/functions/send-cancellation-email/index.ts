
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CancellationEmailRequest {
  email: string;
  name?: string;
}

const getCancellationEmailHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We're Sorry to See You Go | lwlnow</title>
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
            color: #1f2937;
        }
        .description {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .message-card {
            background-color: #fef3c7;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid #fde68a;
        }
        .message {
            color: #92400e;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 16px;
        }
        .access-info {
            background-color: #f0f9ff;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            border: 1px solid #e0f2fe;
        }
        .access-text {
            color: #0369a1;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .reactivate-button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(to right, #f59e0b, #d946ef);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            margin-top: 16px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .reactivate-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
            <h1>We're Sorry to See You Go</h1>
            <p class="description">Your subscription has been successfully canceled</p>
        </div>
        
        <div class="message-card">
            <p class="message">
                Thank you for being part of the lwlnow community. We're sad to see you go, but we understand that circumstances change.
            </p>
            <p class="message">
                Your subscription has been canceled and you will not be charged again. However, you still have access to all Premium features until your current billing period ends.
            </p>
        </div>
        
        <div class="access-info">
            <p class="access-text">
                <strong>Good news:</strong> You can still use all Premium features until your subscription expires. After that, you'll automatically switch to our free plan.
            </p>
            <p class="access-text">
                Changed your mind? You can reactivate your subscription anytime by visiting your account settings.
            </p>
        </div>
        
        <div style="text-align: center;">
            <a href="https://www.lwlnow.com/dashboard/subscription" class="reactivate-button">Reactivate Subscription</a>
        </div>
        
        <div style="margin-top: 24px; color: #64748b; font-size: 14px;">
            <h3 style="color: #374151; margin-bottom: 12px;">What you'll miss:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li>Access to all languages</li>
                <li>Unlimited exercises and vocabulary lists</li>
                <li>AI-powered features</li>
                <li>Advanced audio generation</li>
                <li>Export capabilities</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>We'd love to have you back anytime. Thank you for choosing lwlnow!</p>
            <p style="margin-top: 8px;">Questions? Contact us at <a href="mailto:support@lwlnow.com" style="color: #d946ef;">support@lwlnow.com</a></p>
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
    const { email, name }: CancellationEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending subscription cancellation email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "support@marketing.lwlnow.com",
      to: [email],
      subject: "We're Sorry to See You Go - Your lwlnow Subscription",
      html: getCancellationEmailHTML(),
    });

    console.log("Subscription cancellation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-cancellation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send cancellation email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
