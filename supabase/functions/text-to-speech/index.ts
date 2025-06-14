
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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
      'korean': 'shimmer'
    }

    const voice = voiceMap[language.toLowerCase()] || 'alloy'

    console.log('Generating audio for text:', text.substring(0, 50) + '...')

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
    
    // Generate unique filename with timestamp and hash
    const timestamp = Date.now()
    const textHash = btoa(text.substring(0, 20)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)
    const fileName = `audio_${timestamp}_${textHash}.mp3`
    
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
      // Fallback to base64 data URL if storage fails
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)))
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`
      console.log('Falling back to data URL due to storage error')
      
      return new Response(JSON.stringify({ audio_url: audioUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
