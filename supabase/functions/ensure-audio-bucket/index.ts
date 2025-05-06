
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get service role key from environment variable
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Missing environment variables for Supabase');
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get list of buckets
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    if (listError) {
      throw listError;
    }

    // Check if audio bucket exists
    const audioBucket = buckets.find(bucket => bucket.name === 'audio');
    
    if (!audioBucket) {
      // Create audio bucket
      const { data, error: createError } = await supabase
        .storage
        .createBucket('audio', { 
          public: true,
          fileSizeLimit: 5242880, // 5MB limit
          allowedMimeTypes: ['audio/mpeg', 'audio/mp3']
        });
      
      if (createError) {
        throw createError;
      }
      
      // Create public access policy for the bucket
      const { error: policyError } = await supabase
        .storage
        .from('audio')
        .createSignedUrls(['dummy.mp3'], 60);
      
      if (policyError) {
        console.warn('Note: Could not test signed URLs. This is expected for new buckets.');
      }
      
      return new Response(
        JSON.stringify({ message: 'Audio bucket created successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ message: 'Audio bucket already exists' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
