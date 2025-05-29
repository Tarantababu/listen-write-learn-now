
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PremiumEmailRequest {
  email: string;
  name?: string;
}

const getPremiumEmailHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Premium | lwlnow</title>
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
            background: linear-gradient(to right, #f59e0b, #d946ef);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        .description {
            color: #64748b;
            font-size: 14px;
        }
        .premium-card {
            background-color: #fdf4ff;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid #fae8ff;
        }
        .premium-icon {
            font-size: 48px;
            margin-bottom: 16px;
            background: linear-gradient(to right, #f59e0b, #d946ef);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        .benefits {
            margin: 16px 0;
        }
        .benefit-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
            font-size: 14px;
        }
        .benefit-icon {
            flex-shrink: 0;
            margin-right: 8px;
            color: #d946ef;
            font-weight: bold;
        }
        .explore-button {
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
        .explore-button:hover {
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
            <h1>Welcome to Premium! ✨</h1>
            <p class="description">Your all-access pass to language mastery</p>
        </div>
        
        <div class="premium-card">
            <div class="premium-icon">★</div>
            <h3 style="margin-bottom: 16px; color: #7e22ce;">Your Premium Features:</h3>
            <div class="benefits">
                <div class="benefit-item">
                    <span class="benefit-icon">•</span>
                    <span><strong>All languages</strong> - Complete access to our entire language catalog</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">•</span>
                    <span><strong>Unlimited exercises</strong> - Practice without restrictions</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">•</span>
                    <span><strong>Unlimited vocabulary lists</strong> - Create and save as many word lists as you need</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">•</span>
                    <span><strong>Editable exercises</strong> - Customize any exercise to your needs</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">•</span>
                    <span><strong>Advanced Audio</strong> - High-quality audio generation for all exercises</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">•</span>
                    <span><strong>AI Vocabulary Cards</strong> - Automatic flashcard creation powered by AI</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">•</span>
                    <span><strong>Export tools</strong> - Download audio and flashcards for offline use</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">•</span>
                    <span><strong>Ready-to-use exercises</strong> - Fresh content added regularly</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">•</span>
                    <span><strong>Reading Analysis</strong> - Detailed breakdowns for every exercise</span>
                </div>
            </div>
            <a href="https://www.lwlnow.com/dashboard" class="explore-button">Start Using Premium Features</a>
        </div>
        
        <div class="footer">
            <p>Need help? Contact our <a href="mailto:premium-support@lwlnow.com" style="color: #d946ef;">Premium Support</a></p>
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
    const { email, name }: PremiumEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending premium subscription email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "support@marketing.lwlnow.com",
      to: [email],
      subject: "Your Premium Language Toolkit is Ready!",
      html: getPremiumEmailHTML(),
    });

    console.log("Premium subscription email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-premium-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send premium subscription email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
