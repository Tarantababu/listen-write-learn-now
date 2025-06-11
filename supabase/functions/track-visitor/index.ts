
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [TRACK-VISITOR] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Visitor tracking started");
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Required environment variables are missing');
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    const { visitorId, page, referer, userAgent, timestamp } = body;
    
    // Enhanced input validation
    if (!visitorId || typeof visitorId !== 'string' || visitorId.length > 255) {
      logStep("Invalid visitor ID", { visitorId });
      return new Response(
        JSON.stringify({ error: 'Invalid visitor ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!page || typeof page !== 'string' || page.length > 500) {
      logStep("Invalid page parameter", { page });
      return new Response(
        JSON.stringify({ error: 'Invalid page parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get and anonymize IP address
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    let ipAddress = forwardedFor ? forwardedFor.split(',')[0] : 
                   realIp || cfConnectingIp || 'unknown';
    
    // Anonymize IP by removing last octet for IPv4
    if (ipAddress !== 'unknown' && ipAddress.includes('.')) {
      ipAddress = ipAddress.replace(/(\d+\.\d+\.\d+)\.\d+/, '$1.0');
    }
    
    logStep("Processing visitor data", {
      visitorId: visitorId.substring(0, 8) + '...',
      page,
      anonymizedIp: ipAddress
    });
    
    // Enhanced rate limiting check
    try {
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const { count: recentVisits } = await supabaseClient
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .gte('created_at', oneMinuteAgo);
      
      if (recentVisits && recentVisits > 30) {
        logStep("Rate limit exceeded", { ip: ipAddress, count: recentVisits });
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (rateLimitError) {
      logStep("Rate limit check failed, proceeding", { error: rateLimitError.message });
    }
    
    // Handle timestamp validation
    let visitTimestamp;
    if (timestamp) {
      try {
        visitTimestamp = new Date(timestamp);
        if (isNaN(visitTimestamp.getTime())) {
          logStep("Invalid timestamp, using current time", { providedTimestamp: timestamp });
          visitTimestamp = new Date();
        }
      } catch (e) {
        logStep("Timestamp parsing error, using current time", { error: e.message });
        visitTimestamp = new Date();
      }
    } else {
      visitTimestamp = new Date();
    }
    
    const formattedTimestamp = visitTimestamp.toISOString();
    
    // Enhanced visitor tracking with duplicate detection
    try {
      // Check for recent duplicate entries (same visitor, same page, within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentEntry } = await supabaseClient
        .from('visitors')
        .select('id')
        .eq('visitor_id', visitorId)
        .eq('page', page)
        .gte('created_at', fiveMinutesAgo)
        .limit(1)
        .maybeSingle();
      
      if (recentEntry) {
        logStep("Duplicate visit detected, skipping", { 
          visitorId: visitorId.substring(0, 8) + '...',
          page 
        });
        return new Response(
          JSON.stringify({ 
            success: true, 
            timestamp: formattedTimestamp,
            duplicate: true 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Insert the visitor data
      const { data, error } = await supabaseClient
        .from('visitors')
        .insert({
          visitor_id: visitorId,
          page,
          referer: referer && referer.length <= 500 ? referer : null,
          user_agent: userAgent && userAgent.length <= 500 ? userAgent : null,
          ip_address: ipAddress,
          created_at: formattedTimestamp
        })
        .select('id')
        .single();
      
      if (error) {
        logStep("Database insert failed", { error: error.message });
        throw error;
      }
      
      logStep("Visitor tracked successfully", { 
        id: data.id,
        visitorId: visitorId.substring(0, 8) + '...',
        page 
      });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          timestamp: formattedTimestamp,
          id: data.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (dbError) {
      logStep("Database operation failed", { error: dbError.message });
      throw dbError;
    }
    
  } catch (error) {
    logStep("Fatal error in visitor tracking", { 
      error: error.message, 
      stack: error.stack 
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to track visitor',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
