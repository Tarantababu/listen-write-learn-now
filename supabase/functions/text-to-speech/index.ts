
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

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for audio generation');
    }

    if (text.length > 4096) {
      throw new Error('Text is too long. Maximum length is 4096 characters.');
    }

    console.log(`[TTS] Starting generation for ${text.length} chars in ${language} with ${quality} quality`);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine voice based on language with fallback
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

    // Generate speech using OpenAI with retry logic
    let response;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            input: text.substring(0, 4096), // Ensure we don't exceed OpenAI limit
            voice: voice,
            response_format: 'mp3',
            speed: 1.0
          }),
        });

        if (response.ok) {
          break; // Success, exit retry loop
        } else {
          const errorText = await response.text();
          console.error(`[TTS] OpenAI API error (attempt ${retryCount + 1}):`, errorText);
          
          if (retryCount === maxRetries) {
            throw new Error(`OpenAI API error after ${maxRetries + 1} attempts: ${response.status} ${errorText}`);
          }
        }
      } catch (fetchError) {
        console.error(`[TTS] Network error (attempt ${retryCount + 1}):`, fetchError);
        
        if (retryCount === maxRetries) {
          throw new Error(`Network error after ${maxRetries + 1} attempts: ${fetchError.message}`);
        }
      }
      
      retryCount++;
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }

    // Get audio data
    const audioBuffer = await response!.arrayBuffer();
    const audioData = new Uint8Array(audioBuffer);

    console.log(`[TTS] Generated audio: ${audioData.length} bytes`);

    // Create unique filename with better organization
    const timestamp = new Date().getTime();
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    const hashArray = Array.from(new Uint8Array(hash.slice(0, 8)));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const filename = `${language}/${timestamp}_${hashHex}.mp3`;
    
    console.log(`[TTS] Uploading to storage: ${filename}`);

    // Ensure the audio bucket exists with proper error handling
    try {
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
    } catch (bucketError) {
      console.error('[TTS] Bucket check/creation failed:', bucketError);
      // Continue anyway, bucket might exist but we can't list it
    }

    // Upload to Supabase Storage with retry logic
    let uploadAttempts = 0;
    const maxUploadAttempts = 3;
    let uploadData, uploadError;

    while (uploadAttempts < maxUploadAttempts) {
      const result = await supabase.storage
        .from('audio')
        .upload(filename, audioData, {
          contentType: 'audio/mpeg',
          upsert: false
        });

      uploadData = result.data;
      uploadError = result.error;

      if (!uploadError) {
        break; // Success
      }

      uploadAttempts++;
      console.error(`[TTS] Storage upload error (attempt ${uploadAttempts}):`, uploadError);

      if (uploadAttempts < maxUploadAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
      }
    }

    if (uploadError) {
      console.error('[TTS] Final storage upload error:', uploadError);
      throw new Error(`Failed to upload audio after ${maxUploadAttempts} attempts: ${uploadError.message}`);
    }

    // Get public URL using the correct method
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(filename);

    // Ensure we have a valid URL
    if (!urlData?.publicUrl) {
      throw new Error('Failed to generate public URL for audio file');
    }

    const audioUrl = urlData.publicUrl;
    console.log(`[TTS] Audio uploaded successfully: ${audioUrl}`);

    // Enhanced verification with multiple attempts
    let verificationPassed = false;
    for (let i = 0; i < 3; i++) {
      try {
        const verifyResponse = await fetch(audioUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        
        if (verifyResponse.ok) {
          verificationPassed = true;
          console.log(`[TTS] Audio URL verified successfully on attempt ${i + 1}`);
          break;
        } else {
          console.warn(`[TTS] Audio URL verification failed (attempt ${i + 1}): ${verifyResponse.status}`);
        }
      } catch (verifyError) {
        console.warn(`[TTS] Audio URL verification error (attempt ${i + 1}):`, verifyError);
      }
      
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!verificationPassed) {
      console.warn('[TTS] Audio URL verification failed after 3 attempts, but continuing');
    }

    // Return enhanced response with metadata
    return new Response(
      JSON.stringify({
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
        public_url: audioUrl,
        verification_passed: verificationPassed,
        generation_time: Date.now() - timestamp
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[TTS] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Audio generation failed',
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
