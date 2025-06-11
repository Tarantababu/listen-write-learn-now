
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [GET-ADMIN-STATS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    logStep("Function started");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep("Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      logStep("Authentication failed", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify admin role
    const { data: adminData, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (adminError || !adminData) {
      logStep("Admin check failed", { error: adminError?.message });
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    logStep("Admin user authenticated", { email: user.email });
    
    // Initialize response data with defaults
    let responseData = {
      totalUsers: 0,
      subscribedUsers: 0,
      subscribeButtonClicks: 0,
      activeUsers: 0,
      totalVisitors: 0,
      uniqueVisitors: 0,
      conversionRate: 0,
      timestamp: new Date().toISOString(),
      dataSource: 'database_fallback',
      errors: [] as string[]
    };
    
    // Get basic user counts with error handling
    try {
      const { count: totalUsersCount, error: totalUsersError } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (totalUsersError) {
        logStep("Error counting users", { error: totalUsersError.message });
        responseData.errors.push(`User count error: ${totalUsersError.message}`);
      } else {
        responseData.totalUsers = totalUsersCount || 0;
        logStep("Total users counted", { count: totalUsersCount });
      }
    } catch (error) {
      logStep("Exception counting users", { error: error.message });
      responseData.errors.push(`User count exception: ${error.message}`);
    }
    
    // Enhanced Stripe subscription data collection
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        logStep("Querying Stripe for enhanced subscription data");
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        
        // Get comprehensive subscription data
        const [activeSubscriptions, trialingSubscriptions, pastDueSubscriptions] = await Promise.all([
          stripe.subscriptions.list({ status: 'active', limit: 100 }),
          stripe.subscriptions.list({ status: 'trialing', limit: 100 }),
          stripe.subscriptions.list({ status: 'past_due', limit: 100 })
        ]);
        
        // Get canceled subscriptions that still have access
        const canceledSubscriptions = await stripe.subscriptions.list({
          status: 'canceled',
          limit: 100,
        });
        
        const canceledWithAccess = canceledSubscriptions.data.filter(sub => 
          sub.current_period_end * 1000 > Date.now()
        );
        
        // Calculate total active subscribers
        const totalActiveSubscribers = 
          activeSubscriptions.data.length + 
          trialingSubscriptions.data.length + 
          pastDueSubscriptions.data.length +
          canceledWithAccess.length;
        
        responseData.subscribedUsers = totalActiveSubscribers;
        responseData.dataSource = 'stripe_enhanced';
        
        logStep("Enhanced Stripe data collected", {
          active: activeSubscriptions.data.length,
          trialing: trialingSubscriptions.data.length,
          pastDue: pastDueSubscriptions.data.length,
          canceledWithAccess: canceledWithAccess.length,
          total: totalActiveSubscribers
        });
        
        // Update database with fresh subscription data
        const allActiveCustomers = [
          ...activeSubscriptions.data,
          ...trialingSubscriptions.data,
          ...pastDueSubscriptions.data,
          ...canceledWithAccess
        ];
        
        for (const subscription of allActiveCustomers) {
          try {
            if (typeof subscription.customer === 'string') {
              const customer = await stripe.customers.retrieve(subscription.customer);
              if (customer && !customer.deleted && customer.email) {
                await supabaseClient
                  .from('subscribers')
                  .upsert({
                    email: customer.email,
                    stripe_customer_id: subscription.customer,
                    subscribed: true,
                    subscription_tier: 'premium',
                    subscription_status: subscription.status,
                    subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'email' });
              }
            }
          } catch (customerError) {
            logStep("Error updating customer data", { 
              customerId: subscription.customer, 
              error: customerError.message 
            });
          }
        }
        
      } catch (stripeError) {
        logStep("Stripe query failed, using database fallback", { error: stripeError.message });
        responseData.errors.push(`Stripe error: ${stripeError.message}`);
        responseData.dataSource = 'database_fallback';
        
        // Fallback to database count
        try {
          const { count: dbSubscribedCount, error: subscribedUsersError } = await supabaseClient
            .from('subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('subscribed', true);
            
          if (!subscribedUsersError) {
            responseData.subscribedUsers = dbSubscribedCount || 0;
          } else {
            responseData.errors.push(`DB subscriber count error: ${subscribedUsersError.message}`);
          }
        } catch (dbError) {
          responseData.errors.push(`DB fallback error: ${dbError.message}`);
        }
      }
    } else {
      logStep("No Stripe key found, using database only");
      responseData.dataSource = 'database_only';
      
      try {
        const { count: dbSubscribedCount, error: subscribedUsersError } = await supabaseClient
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('subscribed', true);
          
        if (!subscribedUsersError) {
          responseData.subscribedUsers = dbSubscribedCount || 0;
        } else {
          responseData.errors.push(`Subscriber count error: ${subscribedUsersError.message}`);
        }
      } catch (error) {
        responseData.errors.push(`Subscriber count exception: ${error.message}`);
      }
    }
    
    // Enhanced visitor analytics - FIXED TO HANDLE LARGE DATASETS
    try {
      // Get total visitors count - using count query instead of fetching all data
      const { count: totalVisitorsCount, error: visitorsError } = await supabaseClient
        .from('visitors')
        .select('*', { count: 'exact', head: true });
      
      if (visitorsError) {
        logStep("Error counting total visitors", { error: visitorsError.message });
        responseData.errors.push(`Total visitors error: ${visitorsError.message}`);
      } else {
        responseData.totalVisitors = totalVisitorsCount || 0;
        logStep("Total visitors counted", { count: totalVisitorsCount });
      }
      
      // Get unique visitors using SQL aggregation function for efficiency
      const { data: uniqueVisitorsData, error: uniqueVisitorsError } = await supabaseClient
        .rpc('get_unique_visitor_count');
      
      if (uniqueVisitorsError) {
        logStep("Error getting unique visitors via RPC, using fallback", { error: uniqueVisitorsError.message });
        
        // Fallback: use a limited query to estimate unique visitors
        const { data: sampleVisitorData, error: sampleError } = await supabaseClient
          .from('visitors')
          .select('visitor_id')
          .limit(10000); // Sample first 10k to estimate
        
        if (!sampleError && sampleVisitorData) {
          const uniqueIds = new Set(sampleVisitorData.map(v => v.visitor_id));
          // If we hit the limit, this is an underestimate
          responseData.uniqueVisitors = uniqueIds.size;
          if (sampleVisitorData.length === 10000) {
            responseData.errors.push(`Unique visitors count is estimated (sample of 10k records)`);
          }
          logStep("Unique visitors estimated from sample", { count: uniqueIds.size });
        } else {
          responseData.errors.push(`Unique visitors fallback error: ${sampleError?.message}`);
        }
      } else {
        responseData.uniqueVisitors = uniqueVisitorsData || 0;
        logStep("Unique visitors counted via RPC", { count: uniqueVisitorsData });
      }
      
    } catch (error) {
      logStep("Error collecting visitor data", { error: error.message });
      responseData.errors.push(`Visitor data error: ${error.message}`);
    }
    
    // Enhanced button click tracking - using count query
    try {
      const { count: buttonClickCount, error: buttonClickError } = await supabaseClient
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .like('page', 'button_click:%');
        
      if (!buttonClickError) {
        responseData.subscribeButtonClicks = buttonClickCount || 0;
        logStep("Button clicks counted", { count: buttonClickCount });
      } else {
        responseData.errors.push(`Button click error: ${buttonClickError.message}`);
      }
    } catch (error) {
      responseData.errors.push(`Button click exception: ${error.message}`);
    }
    
    // Calculate active users (users with activity in last 30 days)
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsersCount } = await supabaseClient
        .from('user_daily_activities')
        .select('user_id', { count: 'exact', head: true })
        .gte('activity_date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      responseData.activeUsers = activeUsersCount || 0;
      
      logStep("Active users calculated", { count: activeUsersCount });
    } catch (error) {
      logStep("Error calculating active users", { error: error.message });
      responseData.errors.push(`Active users error: ${error.message}`);
    }
    
    // Calculate conversion rate
    if (responseData.totalUsers > 0) {
      responseData.conversionRate = Math.round(
        (responseData.subscribedUsers / responseData.totalUsers) * 100 * 100
      ) / 100;
    }
    
    logStep("Final response data prepared", {
      totalUsers: responseData.totalUsers,
      subscribedUsers: responseData.subscribedUsers,
      totalVisitors: responseData.totalVisitors,
      uniqueVisitors: responseData.uniqueVisitors,
      conversionRate: responseData.conversionRate,
      dataSource: responseData.dataSource,
      errorCount: responseData.errors.length
    });
    
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    logStep("Fatal error in admin stats function", { error: error.message, stack: error.stack });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
