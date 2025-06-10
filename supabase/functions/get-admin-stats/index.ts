
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Check if request is authorized (user is an admin)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get the user's JWT from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate the JWT and get user info
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the user is an admin
    const { data: adminData, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (adminError || !adminData) {
      console.error("Admin check error:", adminError);
      return new Response(
        JSON.stringify({ error: 'Not an admin user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Admin user authenticated:", user.email);
    
    // Get total users count
    const { count: totalUsersCount, error: totalUsersError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (totalUsersError) {
      console.error("Error counting users:", totalUsersError);
      throw totalUsersError;
    }
    
    // Get accurate subscriber count by querying Stripe directly
    let subscribedUsersCount = 0;
    let subscribeButtonClicks = 0;
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        console.log("Querying Stripe for accurate subscription data...");
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        
        // Get all active subscriptions from Stripe
        const activeSubscriptions = await stripe.subscriptions.list({
          status: 'active',
          limit: 100,
        });
        
        // Get all trialing subscriptions
        const trialingSubscriptions = await stripe.subscriptions.list({
          status: 'trialing',
          limit: 100,
        });
        
        // Get canceled subscriptions that are still in their period
        const canceledSubscriptions = await stripe.subscriptions.list({
          status: 'canceled',
          limit: 100,
        });
        
        // Filter canceled subscriptions that still have access
        const canceledWithAccess = canceledSubscriptions.data.filter(sub => 
          sub.current_period_end * 1000 > Date.now()
        );
        
        // Also check for lifetime payments
        const lifetimePayments = await stripe.paymentIntents.list({
          limit: 100,
        });
        
        const lifetimeCount = lifetimePayments.data.filter(payment => 
          payment.status === "succeeded" && 
          payment.metadata?.plan === "lifetime"
        ).length;
        
        // Calculate total active subscribers
        subscribedUsersCount = activeSubscriptions.data.length + 
                               trialingSubscriptions.data.length + 
                               canceledWithAccess.length + 
                               lifetimeCount;
        
        console.log("Stripe subscription data:", {
          active: activeSubscriptions.data.length,
          trialing: trialingSubscriptions.data.length,
          canceledWithAccess: canceledWithAccess.length,
          lifetime: lifetimeCount,
          total: subscribedUsersCount
        });
        
        // Update the database with accurate counts
        const allActiveCustomers = [
          ...activeSubscriptions.data.map(sub => sub.customer),
          ...trialingSubscriptions.data.map(sub => sub.customer),
          ...canceledWithAccess.map(sub => sub.customer),
        ];
        
        // Update subscriber records in database for sync
        for (const customerId of allActiveCustomers) {
          if (typeof customerId === 'string') {
            try {
              const customer = await stripe.customers.retrieve(customerId);
              if (customer && !customer.deleted && customer.email) {
                await supabaseClient
                  .from('subscribers')
                  .upsert({
                    email: customer.email,
                    stripe_customer_id: customerId,
                    subscribed: true,
                    subscription_tier: 'premium',
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'email' });
              }
            } catch (customerError) {
              console.warn("Error updating customer:", customerId, customerError);
            }
          }
        }
        
      } catch (stripeError) {
        console.error("Error querying Stripe:", stripeError);
        // Fall back to database count if Stripe query fails
        const { count: dbSubscribedCount, error: subscribedUsersError } = await supabaseClient
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('subscribed', true);
          
        if (!subscribedUsersError) {
          subscribedUsersCount = dbSubscribedCount || 0;
        }
      }
    } else {
      console.warn("No Stripe key found, using database fallback");
      // Fall back to database count
      const { count: dbSubscribedCount, error: subscribedUsersError } = await supabaseClient
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('subscribed', true);
        
      if (!subscribedUsersError) {
        subscribedUsersCount = dbSubscribedCount || 0;
      }
    }
    
    // Get subscribe button clicks
    try {
      const { count: buttonClickCount, error: buttonClickError } = await supabaseClient
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .like('page', 'button_click:%');
        
      if (!buttonClickError) {
        subscribeButtonClicks = buttonClickCount || 0;
      }
    } catch (err) {
      console.warn("Error counting button clicks:", err);
    }
    
    // Return the data
    const responseData = {
      totalUsers: totalUsersCount || 0,
      subscribedUsers: subscribedUsersCount,
      subscribeButtonClicks: subscribeButtonClicks,
      timestamp: new Date().toISOString(),
      dataSource: stripeKey ? 'stripe_direct' : 'database_fallback'
    };
    
    console.log("Admin stats retrieved successfully:", responseData);
    
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in admin stats function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
