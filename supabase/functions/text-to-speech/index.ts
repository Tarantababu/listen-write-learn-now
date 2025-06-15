
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

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
    const { text, language, quality = 'standard', priority = 'normal' } = await req.json();

    console.log(`[TTS] Request received: ${JSON.stringify({ text: text?.length, language, quality, priority })}`);

    if (!text || text.trim().length === 0) {
      console.error('[TTS] No text provided');
      throw new Error('Text is required for audio generation');
    }

    console.log(`[TTS] Generating audio for text (${text.length} chars) in ${language}`);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('[TTS] OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine voice based on language
    const voiceMap: Record<string, string> = {
      'english': 'alloy',
      'spanish': 'nova', 
      'french': 'shimmer',
      'german': 'echo',
      'italian': 'fable',
      'portuguese': 'onyx'
    };
    
    const voice = voiceMap[language.toLowerCase()] || 'alloy';
    const model = quality === 'high' ? 'tts-1-hd' : 'tts-1';

    console.log(`[TTS] Using voice: ${voice}, model: ${model}`);

    // Generate speech using OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        input: text.substring(0, 4096), // OpenAI limit
        voice: voice,
        response_format: 'mp3',
        speed: 1.0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();
    const audioData = new Uint8Array(audioBuffer);

    console.log(`[TTS] Generated audio: ${audioData.length} bytes`);

    // Create unique filename with better organization
    const timestamp = new Date().getTime();
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    const hashArray = Array.from(new Uint8Array(hash.slice(0, 8)));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const filename = `${language}/${timestamp}_${hashHex}.mp3`;
    
    console.log(`[TTS] Uploading to storage: ${filename}`);

    // Ensure the audio bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const audioBucket = buckets?.find(bucket => bucket.name === 'audio');
    
    if (!audioBucket) {
      console.log('[TTS] Creating audio bucket');
      const { error: bucketError } = await supabase.storage.createBucket('audio', {
        public: true,
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (bucketError) {
        console.error('[TTS] Failed to create audio bucket:', bucketError);
        throw new Error(`Failed to create audio bucket: ${bucketError.message}`);
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(filename, audioData, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('[TTS] Storage upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get public URL using the correct method
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(filename);

    // Ensure we have a valid URL
    if (!urlData?.publicUrl) {
      console.error('[TTS] Failed to generate public URL');
      throw new Error('Failed to generate public URL for audio file');
    }

    const audioUrl = urlData.publicUrl;
    console.log(`[TTS] Audio uploaded successfully: ${audioUrl}`);

    // Verify the URL is accessible
    try {
      const verifyResponse = await fetch(audioUrl, { method: 'HEAD' });
      if (!verifyResponse.ok) {
        console.warn(`[TTS] Audio URL verification failed: ${verifyResponse.status}`);
        // Don't throw here, just log the warning
      } else {
        console.log(`[TTS] Audio URL verified successfully`);
      }
    } catch (verifyError) {
      console.warn(`[TTS] Audio URL verification error:`, verifyError);
      // Don't throw here, just log the warning
    }

    // Return response with audio URL and metadata
    const successResponse = {
      success: true,
      audio_url: audioUrl,
      audioUrl: audioUrl, // For compatibility
      filename: filename,
      duration: Math.ceil(text.length / 10), // Rough estimate
      size: audioData.length,
      voice: voice,
      quality: quality,
      language: language,
      storage_path: filename,
      public_url: audioUrl
    };

    console.log(`[TTS] Success response:`, { ...successResponse, audio_url: 'URL_SET' });

    return new Response(
      JSON.stringify(successResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[TTS] Error:', error);
    const errorResponse = { 
      success: false,
      error: error.message || 'Audio generation failed',
      details: error.toString()
    };
    
    console.log(`[TTS] Error response:`, errorResponse);
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
