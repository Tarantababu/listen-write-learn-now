
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

const getWelcomeEmailHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to lwlnow | Start Your Language Journey</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
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
            margin-bottom: 32px;
            text-align: center;
        }
        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
            background: linear-gradient(to right, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        .subheader {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 16px;
            color: #1e293b;
        }
        .description {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .method-card {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
        }
        .step {
            margin-bottom: 32px;
        }
        .step-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background-color: #e0e7ff;
            color: #3b82f6;
            font-weight: 600;
            border-radius: 50%;
            margin-right: 8px;
        }
        .step-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        .step-content {
            padding-left: 36px;
        }
        .step-description {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 12px;
        }
        ul {
            padding-left: 20px;
            margin: 12px 0;
        }
        li {
            margin-bottom: 6px;
            color: #475569;
        }
        .cta-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            margin-top: 8px;
        }
        .cta-button:hover {
            background-color: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .final-cta {
            text-align: center;
            margin-top: 32px;
            padding: 24px;
            background-color: #f0f9ff;
            border-radius: 8px;
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
            <h1>Welcome to lwlnow!</h1>
            <p class="subheader">Start your language journey today</p>
        </div>
        
        <div class="method-card">
            <h2 class="description">How I Learn a Language with lwlnow</h2>
            <p class="step-description">A simple and effective method to make the most of your language learning journey</p>
            
            <!-- Step 1 -->
            <div class="step">
                <div class="step-title">
                    <span class="step-number">1</span>
                    Choose or Create Your Practice Text
                </div>
                <div class="step-content">
                    <p class="step-description">Start by selecting a text that matches your current level:</p>
                    <ul>
                        <li><strong>Use our ready-made curriculum</strong> based on CEFR levels (A1, A2, B1, etc.).</li>
                        <li><strong>Or create your own content.</strong> A simple paragraph or a few sentences is enough.</li>
                    </ul>
                    <a href="https://www.lwlnow.com/dashboard/curriculum" class="cta-button">Browse Curriculum</a>
                </div>
            </div>
            
            <!-- Step 2 -->
            <div class="step">
                <div class="step-title">
                    <span class="step-number">2</span>
                    Do a Dictation Exercise
                </div>
                <div class="step-content">
                    <ul>
                        <li>Listen to the audio.</li>
                        <li>Type what you hear, as accurately as possible.</li>
                        <li>Repeat the exercise until you get <strong>at least 95% accuracy three times.</strong></li>
                    </ul>
                    <p class="step-description">The app tracks your attempts automatically—this method is based on 100+ hours of real learner experience.</p>
                    <a href="https://www.lwlnow.com/dashboard/exercises" class="cta-button">Go to Exercises</a>
                </div>
            </div>
            
            <!-- Step 3 -->
            <div class="step">
                <div class="step-title">
                    <span class="step-number">3</span>
                    Review Your Mistakes
                </div>
                <div class="step-content">
                    <p class="step-description">After each try, you'll see a detailed comparison between your answer and the original. Learn from your errors and improve with each attempt.</p>
                </div>
            </div>
            
            <!-- Step 4 -->
            <div class="step">
                <div class="step-title">
                    <span class="step-number">4</span>
                    Save New Words and Phrases
                </div>
                <div class="step-content">
                    <ul>
                        <li>Click on unfamiliar words to add them to your <strong>Vocabulary</strong>.</li>
                        <li>Easily create flashcards for future review.</li>
                    </ul>
                    <a href="https://www.lwlnow.com/dashboard/vocabulary" class="cta-button">Go to Vocabulary</a>
                </div>
            </div>
            
            <!-- Step 5 -->
            <div class="step">
                <div class="step-title">
                    <span class="step-number">5</span>
                    Listen to Your Flashcards Anytime
                </div>
                <div class="step-content">
                    <p class="step-description">All saved flashcards are automatically added to a <strong>personal audio playlist</strong>. Perfect for learning while walking, commuting, or relaxing—ideal for <strong>passive listening</strong>.</p>
                </div>
            </div>
            
            <!-- Step 6 -->
            <div class="step">
                <div class="step-title">
                    <span class="step-number">6</span>
                    Track Your Progress
                </div>
                <div class="step-content">
                    <p class="step-description">Monitor your growth toward <strong>B1</strong>, <strong>B2</strong>, or <strong>C1</strong>:</p>
                    <ul>
                        <li>See your known word range.</li>
                        <li>Click the <strong>(?) icon</strong> for insights on what vocabulary level you're currently reaching.</li>
                    </ul>
                    <a href="https://www.lwlnow.com/dashboard" class="cta-button">Go to Dashboard</a>
                </div>
            </div>
        </div>
        
        <div class="final-cta">
            <p style="font-weight: 500; margin-bottom: 12px;">This method works because it's <strong>simple, consistent, and proven</strong>.</p>
            <p style="margin-bottom: 16px;">Start now and build your fluency step by step.</p>
            <a href="https://www.lwlnow.com/login" class="cta-button">Get Started</a>
        </div>
        
        <div class="footer">
            <p>Happy learning! The lwlnow team</p>
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
    const { email, name }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending welcome email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "lwlnow <welcome@lwlnow.com>",
      to: [email],
      subject: "Welcome to lwlnow - Start Your Language Journey!",
      html: getWelcomeEmailHTML(),
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send welcome email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
