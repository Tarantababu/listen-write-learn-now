
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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
    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if 'audio' bucket exists
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketError) {
      throw bucketError;
    }
    
    const audioBucket = buckets.find(bucket => bucket.name === 'audio');
    
    if (!audioBucket) {
      // Create the audio bucket if it doesn't exist
      const { data, error } = await supabase
        .storage
        .createBucket('audio', {
          public: true, // Make bucket public
          fileSizeLimit: 52428800, // 50MB
        });
      
      if (error) {
        throw error;
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Audio bucket created successfully',
          data
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Audio bucket already exists',
          data: audioBucket
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
  } catch (error) {
    console.error('Error creating audio bucket:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
