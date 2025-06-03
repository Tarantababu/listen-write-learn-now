
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Subscription plan definitions
const PLANS = {
  monthly: {
    name: "Monthly Premium",
    description: "Full access, cancel anytime",
    unit_amount: 499, // $4.99
    interval: "month" as const,
    interval_count: 1,
    trial_period_days: 7,
  },
  quarterly: {
    name: "Quarterly Premium",
    description: "Save 13% vs monthly",
    unit_amount: 1299, // $12.99
    interval: "month" as const,
    interval_count: 3,
    trial_period_days: 7,
  },
  annual: {
    name: "Annual Premium",
    description: "Save 25%, billed annually",
    unit_amount: 4499, // $44.99
    interval: "year" as const,
    interval_count: 1,
    trial_period_days: 7,
  },
  lifetime: {
    name: "Lifetime Access",
    description: "Pay once, get lifetime access to all current & future features",
    unit_amount: 11999, // $119.99
    isOneTime: true,
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Parse request body
    const requestData = await req.json().catch(() => ({}));
    const planId = requestData.planId || 'monthly';
    const currency = requestData.currency || 'usd';
    
    logStep("Request data", { planId, currency });

    // Get Stripe key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    // Authenticate user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Get selected plan
    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) throw new Error(`Invalid plan ID: ${planId}`);
    logStep("Plan selected", { plan: planId });

    // Create checkout session based on plan type
    let session;
    
    if (plan.isOneTime) {
      // Create one-time payment session for lifetime plan
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: plan.name,
                description: plan.description,
              },
              unit_amount: plan.unit_amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/dashboard?subscription=success&plan=${planId}`,
        cancel_url: `${req.headers.get("origin")}/dashboard?subscription=canceled`,
      });
      
      logStep("One-time payment checkout session created", { 
        sessionId: session.id,
        planId,
        mode: "payment" 
      });
    } else {
      // Create subscription session for recurring plans
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: plan.name,
                description: plan.description,
              },
              unit_amount: plan.unit_amount,
              recurring: {
                interval: plan.interval,
                interval_count: plan.interval_count,
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        subscription_data: {
          trial_period_days: plan.trial_period_days,
        },
        success_url: `${req.headers.get("origin")}/dashboard?subscription=success&plan=${planId}`,
        cancel_url: `${req.headers.get("origin")}/dashboard?subscription=canceled`,
      });
      
      logStep("Subscription checkout session created", { 
        sessionId: session.id, 
        planId,
        trialDays: plan.trial_period_days,
        mode: "subscription"
      });
    }

    // Use service role for secure write operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Upsert subscriber record
    await supabaseService.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscription_status: "pending",
      pending_plan: planId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });

    logStep("Subscriber record updated with pending plan", { planId });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[CREATE-CHECKOUT] ERROR: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
