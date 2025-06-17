
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// OpenAI TTS token limits (conservative estimates)
const MAX_CHARACTERS_PER_REQUEST = 3800 // Conservative limit to stay under 4096 chars
const MIN_CHUNK_SIZE = 200 // Minimum chunk size to avoid too many API calls

// Helper function to create a safe filename from text
function createSafeFilename(text: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.substring(0, 50));
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const hashString = Math.abs(hash).toString(36);
  const timestamp = Date.now();
  
  return `audio_${timestamp}_${hashString}`;
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  
  return btoa(binary);
}

// Intelligent text chunking function
function chunkTextIntelligently(text: string): string[] {
  if (text.length <= MAX_CHARACTERS_PER_REQUEST) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by sentences first
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    // If adding this sentence would exceed the limit
    if ((currentChunk + ' ' + sentence).length > MAX_CHARACTERS_PER_REQUEST) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        // Single sentence is too long, split by clauses
        const clauses = sentence.split(/(?<=[,;:])\s+/);
        for (const clause of clauses) {
          if ((currentChunk + ' ' + clause).length > MAX_CHARACTERS_PER_REQUEST) {
            if (currentChunk.length > 0) {
              chunks.push(currentChunk.trim());
              currentChunk = clause;
            } else {
              // Single clause is too long, split by words
              const words = clause.split(/\s+/);
              for (const word of words) {
                if ((currentChunk + ' ' + word).length > MAX_CHARACTERS_PER_REQUEST) {
                  if (currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = word;
                  } else {
                    // Single word is too long, force split
                    chunks.push(word);
                  }
                } else {
                  currentChunk += (currentChunk ? ' ' : '') + word;
                }
              }
            }
          } else {
            currentChunk += (currentChunk ? ' ' : '') + clause;
          }
        }
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

// Generate audio for a single chunk
async function generateAudioChunk(text: string, voice: string, chunkIndex: number): Promise<ArrayBuffer> {
  console.log(`Generating audio for chunk ${chunkIndex + 1}, length: ${text.length} characters`);
  
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
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI TTS API error for chunk ${chunkIndex + 1}: ${error}`);
  }

  return await response.arrayBuffer();
}

// Concatenate multiple audio buffers (simple approach for MP3)
function concatenateAudioBuffers(audioBuffers: ArrayBuffer[]): ArrayBuffer {
  if (audioBuffers.length === 1) {
    return audioBuffers[0];
  }

  // Calculate total size
  const totalSize = audioBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  
  // Create new buffer and copy all audio data
  const concatenated = new ArrayBuffer(totalSize);
  const view = new Uint8Array(concatenated);
  
  let offset = 0;
  for (const buffer of audioBuffers) {
    const bufferView = new Uint8Array(buffer);
    view.set(bufferView, offset);
    offset += buffer.byteLength;
  }
  
  return concatenated;
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

    console.log('Processing text-to-speech request:', {
      textLength: text.length,
      language,
      voice,
      willChunk: text.length > MAX_CHARACTERS_PER_REQUEST
    });

    // Check if text needs chunking
    if (text.length <= MAX_CHARACTERS_PER_REQUEST) {
      console.log('Text is within limits, processing as single request');
      
      // Generate audio for single chunk
      const audioData = await generateAudioChunk(text, voice, 0);
      
      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Generate filename and upload
      const fileName = createSafeFilename(text) + '.mp3';
      console.log('Uploading single audio file:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, audioData, {
          contentType: 'audio/mp3',
          duplex: 'half'
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        const base64Audio = arrayBufferToBase64(audioData);
        const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
        console.log('Falling back to data URL');
        
        return new Response(JSON.stringify({ audio_url: audioUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      console.log('Single audio file uploaded successfully:', publicUrl);

      return new Response(JSON.stringify({ audio_url: publicUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Text is too long, need to chunk it
    console.log('Text exceeds limits, chunking required');
    const textChunks = chunkTextIntelligently(text);
    console.log(`Split text into ${textChunks.length} chunks`);

    // Generate audio for each chunk with rate limiting
    const audioBuffers: ArrayBuffer[] = [];
    
    for (let i = 0; i < textChunks.length; i++) {
      try {
        const audioData = await generateAudioChunk(textChunks[i], voice, i);
        audioBuffers.push(audioData);
        
        // Add small delay between requests to avoid rate limiting
        if (i < textChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Failed to generate audio for chunk ${i + 1}:`, error);
        throw new Error(`Failed to generate audio for text segment ${i + 1}: ${error.message}`);
      }
    }

    console.log(`Successfully generated ${audioBuffers.length} audio chunks`);

    // Concatenate all audio buffers
    const concatenatedAudio = concatenateAudioBuffers(audioBuffers);
    console.log(`Concatenated audio size: ${concatenatedAudio.byteLength} bytes`);

    // Create Supabase client and upload concatenated audio
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileName = createSafeFilename(text) + '_chunked.mp3';
    
    console.log('Uploading concatenated audio file:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, concatenatedAudio, {
        contentType: 'audio/mp3',
        duplex: 'half'
      });

    if (uploadError) {
      console.error('Storage upload error for concatenated audio:', uploadError);
      const base64Audio = arrayBufferToBase64(concatenatedAudio);
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      console.log('Falling back to data URL for concatenated audio');
      
      return new Response(JSON.stringify({ 
        audio_url: audioUrl,
        chunks_processed: textChunks.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName);

    console.log(`Chunked audio uploaded successfully: ${publicUrl} (${textChunks.length} chunks processed)`);

    return new Response(JSON.stringify({ 
      audio_url: publicUrl,
      chunks_processed: textChunks.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Text-to-speech generation failed. If text is very long, try breaking it into smaller segments.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
