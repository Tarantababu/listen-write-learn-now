
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");
    
    // Get the stripe key from env
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    // Get webhook secret from env
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    
    // Create Stripe instance
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get request body for webhook event
    const body = await req.text();
    
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No Stripe signature found");
    
    // Verify and construct the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Event constructed", { type: event.type });
    } catch (err) {
      logStep("Error verifying webhook", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
    
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        logStep("Checkout completed", { 
          customer: session.customer, 
          subscription: session.subscription,
          email: session.customer_email || session.customer_details?.email
        });
        
        // If subscription was created, update the subscriber record
        if (session.subscription && session.customer) {
          // Fetch subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          // Determine customer email
          const customerEmail = session.customer_email || session.customer_details?.email;
          
          if (customerEmail) {
            // Find the user by email
            const { data: userData, error: userError } = await supabaseAdmin
              .from('auth.users')
              .select('id')
              .eq('email', customerEmail)
              .single();
              
            if (userError) {
              logStep("Error finding user", { error: userError.message });
            }
            
            // Update subscriber record
            await supabaseAdmin.from('subscribers').upsert({
              stripe_customer_id: session.customer as string,
              email: customerEmail,
              user_id: userData?.id,
              subscribed: true,
              subscription_status: subscription.status,
              trial_end: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString() 
                : null,
              subscription_end: subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000).toISOString() 
                : null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'email' });
            
            logStep("Updated subscriber record", { email: customerEmail });
          }
        }
        break;
      }
        
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        logStep("Subscription updated", { 
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status
        });
        
        // Get customer details to find email
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const customerEmail = customer.email;
        
        if (customerEmail) {
          // Update subscriber record
          await supabaseAdmin.from('subscribers').upsert({
            stripe_customer_id: subscription.customer as string,
            email: customerEmail,
            subscribed: ['active', 'trialing'].includes(subscription.status),
            subscription_status: subscription.status,
            trial_end: subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toISOString() 
              : null,
            subscription_end: subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString() 
              : null,
            updated_at: new Date().toISOString(),
            // If cancelled, set the timestamp
            ...(subscription.canceled_at 
              ? { canceled_at: new Date(subscription.canceled_at * 1000).toISOString() }
              : {})
          }, { onConflict: 'email' });
          
          logStep("Updated subscriber record for subscription change", { email: customerEmail });
        }
        break;
      }
        
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        logStep("Subscription deleted", { 
          id: subscription.id,
          customer: subscription.customer
        });
        
        // Get customer details to find email
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const customerEmail = customer.email;
        
        if (customerEmail) {
          // Update subscriber record to indicate cancellation
          await supabaseAdmin.from('subscribers').upsert({
            stripe_customer_id: subscription.customer as string,
            email: customerEmail,
            subscribed: false,
            subscription_status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });
          
          logStep("Updated subscriber record for canceled subscription", { email: customerEmail });
        }
        break;
      }
        
      default:
        logStep(`Unhandled event type: ${event.type}`);
    }
    
    return new Response(JSON.stringify({ received: true }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error in webhook processing", { error: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
