
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Helper function to create a safe filename from text
function createSafeFilename(text: string): string {
  // Create a hash of the text using Web Crypto API for Unicode-safe filename generation
  const encoder = new TextEncoder();
  const data = encoder.encode(text.substring(0, 50)); // Use first 50 chars for hash
  
  // Use a simple hash function for filename generation
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and use base 36 for alphanumeric
  const hashString = Math.abs(hash).toString(36);
  const timestamp = Date.now();
  
  return `audio_${timestamp}_${hashString}`;
}

// Helper function to convert ArrayBuffer to base64 (Unicode-safe)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  // Process in chunks to avoid stack overflow with large files
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, language } = await req.json()

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration not found')
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text content is required')
    }

    // Map language codes to OpenAI TTS voices
    const voiceMap: Record<string, string> = {
      'english': 'alloy',
      'spanish': 'nova',
      'french': 'shimmer',
      'german': 'echo',
      'italian': 'fable',
      'portuguese': 'onyx',
      'russian': 'echo',
      'chinese': 'alloy',
      'japanese': 'nova',
      'korean': 'shimmer',
      'arabic': 'echo',
      'turkish': 'nova',
      'polish': 'shimmer',
      'dutch': 'alloy',
      'swedish': 'nova',
      'norwegian': 'echo'
    }

    const voice = voiceMap[language.toLowerCase()] || 'alloy'

    console.log('Generating audio for text:', text.substring(0, 50) + '...')
    console.log('Using voice:', voice, 'for language:', language)

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3'
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI TTS API error: ${error}`)
    }

    // Get audio data as array buffer
    const audioData = await response.arrayBuffer()
    console.log('Audio data received, size:', audioData.byteLength)

    // Create Supabase client with service role key for storage operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Generate unique filename using Unicode-safe method
    const fileName = createSafeFilename(text) + '.mp3'
    
    console.log('Uploading audio file:', fileName)
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioData, {
        contentType: 'audio/mp3',
        duplex: 'half'
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // Fallback to base64 data URL if storage fails - now Unicode-safe
      try {
        const base64Audio = arrayBufferToBase64(audioData)
        const audioUrl = `data:audio/mp3;base64,${base64Audio}`
        console.log('Falling back to data URL due to storage error')
        
        return new Response(JSON.stringify({ audio_url: audioUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (base64Error) {
        console.error('Base64 encoding also failed:', base64Error)
        throw new Error('Failed to generate audio: both storage and base64 fallback failed')
      }
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName)

    console.log('Audio uploaded successfully, public URL:', publicUrl)

    return new Response(JSON.stringify({ audio_url: publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in text-to-speech function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
