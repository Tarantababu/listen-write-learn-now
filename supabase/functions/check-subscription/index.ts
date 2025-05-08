
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
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key for secure operations
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Get Stripe key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR", { message: "STRIPE_SECRET_KEY is not set" });
      return new Response(
        JSON.stringify({ 
          error: "Stripe key is not configured. Please contact support.",
          subscribed: false,
          subscription_tier: "free",
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 // Return a 400 error code to indicate bad configuration
        }
      );
    }
    
    logStep("Stripe key verified");

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      );
    }
    logStep("Authorization header found");

    // Authenticate user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      return new Response(
        JSON.stringify({ error: `Authentication error: ${userError.message}` }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      );
    }
    
    const user = userData.user;
    if (!user?.email) {
      return new Response(
        JSON.stringify({ error: "User not authenticated or email not available" }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      );
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, updating unsubscribed state");
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: "free",
        subscription_status: null,
        trial_end: null,
        subscription_end: null,
        canceled_at: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: "free",
        subscription_status: null,
        trial_end: null,
        subscription_end: null,
        canceled_at: null,
        plan_type: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // First, check for a lifetime access by looking at completed payments
    const payments = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 100,
    });
    
    // Check if any payment has metadata indicating it's a lifetime plan
    const lifetimePayment = payments.data.find(payment => 
      payment.status === "succeeded" && 
      payment.metadata?.plan === "lifetime"
    );
    
    let hasLifetimeAccess = false;
    if (lifetimePayment) {
      hasLifetimeAccess = true;
      logStep("Lifetime access found", { paymentId: lifetimePayment.id });
    }
    
    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all", // Get all subscriptions to check status
      limit: 5,
    });
    
    // First look for active or trialing subscriptions
    const activeSubscription = subscriptions.data.find(sub => 
      sub.status === "active" || sub.status === "trialing"
    );
    
    // Also check for canceled subscriptions that still have access
    const canceledSubscription = subscriptions.data.find(sub => 
      sub.status === "canceled" && sub.current_period_end * 1000 > Date.now()
    );
    
    // Prioritize active subscriptions over canceled ones
    const subscription = activeSubscription || canceledSubscription;
    
    const hasActiveSub = Boolean(subscription) || hasLifetimeAccess;
    let subscriptionTier = "free";
    let subscriptionEnd = null;
    let trialEnd = null;
    let subscriptionStatus = null;
    let canceledAt = null;
    let planType = null;

    if (hasLifetimeAccess) {
      subscriptionTier = "premium";
      subscriptionStatus = "lifetime";
      planType = "lifetime";
      logStep("User has lifetime access");
    } else if (hasActiveSub && subscription) {
      subscriptionStatus = subscription.status;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionTier = "premium";
      
      // Determine plan type based on interval
      const item = subscription.items.data[0];
      if (item.price.recurring) {
        const interval = item.price.recurring.interval;
        const intervalCount = item.price.recurring.interval_count || 1;
        
        if (interval === "month" && intervalCount === 1) {
          planType = "monthly";
        } else if (interval === "month" && intervalCount === 3) {
          planType = "quarterly";
        } else if (interval === "year" && intervalCount === 1) {
          planType = "annual";
        }
      }
      
      logStep("Plan type determined", { planType });
      
      // Check if subscription has been canceled
      if (subscription.status === "canceled" || subscription.canceled_at) {
        canceledAt = subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000).toISOString() 
          : new Date().toISOString();
        logStep("Subscription was canceled", { canceledAt });
      }
      
      // Check for trial period
      if (subscription.status === "trialing" && subscription.trial_end) {
        trialEnd = new Date(subscription.trial_end * 1000).toISOString();
      }
      
      logStep("Subscription found", { 
        subscriptionId: subscription.id, 
        status: subscriptionStatus,
        endDate: subscriptionEnd,
        trialEnd,
        canceledAt,
        planType
      });
    } else {
      logStep("No active subscription found");
    }

    // Update subscriber info in database
    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_status: subscriptionStatus,
      trial_end: trialEnd,
      subscription_end: subscriptionEnd,
      canceled_at: canceledAt,
      plan_type: planType,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { 
      subscribed: hasActiveSub, 
      subscriptionTier, 
      subscriptionStatus,
      canceledAt,
      planType
    });
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_status: subscriptionStatus,
      trial_end: trialEnd,
      subscription_end: subscriptionEnd,
      canceled_at: canceledAt,
      plan_type: planType
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
