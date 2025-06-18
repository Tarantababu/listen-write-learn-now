
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Enhanced chunk configurations with performance optimizations
const CHUNK_CONFIGS = {
  small: { maxChars: 2000, minChars: 100, batchSize: 5 },
  medium: { maxChars: 3000, minChars: 150, batchSize: 4 },
  large: { maxChars: 3800, minChars: 200, batchSize: 3 },
  auto: { maxChars: 'auto', minChars: 'auto', batchSize: 'auto' }
}

// Cache management utilities
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const cacheMap = new Map();

function getCacheKey(text: string, language: string, chunkSize: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${text}-${language}-${chunkSize}`);
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `tts_${Math.abs(hash).toString(36)}`;
}

function getCachedAudio(cacheKey: string): string | null {
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Cache hit for key: ${cacheKey}`);
    return cached.audioUrl;
  }
  
  if (cached) {
    cacheMap.delete(cacheKey);
    console.log(`Cache expired for key: ${cacheKey}`);
  }
  
  return null;
}

function setCachedAudio(cacheKey: string, audioUrl: string) {
  cacheMap.set(cacheKey, {
    audioUrl,
    timestamp: Date.now()
  });
  console.log(`Cached audio for key: ${cacheKey}`);
}

// Progress tracking utilities
const progressMap = new Map();

function updateProgress(sessionId: string, progress: number, message: string, chunksProcessed?: number, totalChunks?: number) {
  const progressData = {
    progress,
    message,
    chunksProcessed,
    totalChunks,
    timestamp: Date.now()
  };
  
  progressMap.set(sessionId, progressData);
  console.log(`Progress update for ${sessionId}: ${progress}% - ${message}`);
}

function getProgress(sessionId: string) {
  return progressMap.get(sessionId) || null;
}

function clearProgress(sessionId: string) {
  progressMap.delete(sessionId);
}

// Cancellation tracking
const cancellationMap = new Map();

function setCancelled(sessionId: string) {
  cancellationMap.set(sessionId, true);
  console.log(`Cancellation requested for session: ${sessionId}`);
}

function isCancelled(sessionId: string): boolean {
  return cancellationMap.get(sessionId) === true;
}

function clearCancellation(sessionId: string) {
  cancellationMap.delete(sessionId);
}

// Helper function to create a safe filename from text
function createSafeFilename(text: string, sessionId?: string): string {
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
  const sessionPrefix = sessionId ? `${sessionId}_` : '';
  
  return `audio_${sessionPrefix}${timestamp}_${hashString}`;
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

// Intelligent chunk size determination
function getOptimalChunkConfig(textLength: number, chunkSize?: string) {
  if (chunkSize && chunkSize !== 'auto' && CHUNK_CONFIGS[chunkSize]) {
    return CHUNK_CONFIGS[chunkSize];
  }
  
  // Auto-determine based on text length
  if (textLength <= 1000) return CHUNK_CONFIGS.small;
  if (textLength <= 5000) return CHUNK_CONFIGS.medium;
  return CHUNK_CONFIGS.large;
}

// Enhanced text chunking function
function chunkTextIntelligently(text: string, config: any): string[] {
  const maxChars = config.maxChars;
  const minChars = config.minChars;
  
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  
  // For very long texts, use paragraph-based chunking first
  const paragraphs = text.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + '\n\n' + paragraph).length <= maxChars) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      if (currentChunk.length >= minChars) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        // Current chunk too small, need to split paragraph
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        
        for (const sentence of sentences) {
          if ((currentChunk + ' ' + sentence).length <= maxChars) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk.length >= minChars) {
              chunks.push(currentChunk.trim());
              currentChunk = sentence;
            } else {
              // Handle very long sentences
              const words = sentence.split(/\s+/);
              for (const word of words) {
                if ((currentChunk + ' ' + word).length <= maxChars) {
                  currentChunk += (currentChunk ? ' ' : '') + word;
                } else {
                  if (currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = word;
                  } else {
                    chunks.push(word);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

// Generate audio for a single chunk with retry logic and cancellation support
async function generateAudioChunk(
  text: string, 
  voice: string, 
  chunkIndex: number, 
  sessionId: string,
  retryCount = 0
): Promise<ArrayBuffer> {
  const maxRetries = 2;
  
  // Check for cancellation before starting
  if (isCancelled(sessionId)) {
    throw new Error('Generation cancelled by user');
  }
  
  try {
    console.log(`Generating audio for chunk ${chunkIndex + 1}, length: ${text.length} characters (attempt ${retryCount + 1})`);
    
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
      throw new Error(`OpenAI TTS API error: ${error}`);
    }

    // Check for cancellation after API call
    if (isCancelled(sessionId)) {
      throw new Error('Generation cancelled by user');
    }

    return await response.arrayBuffer();
  } catch (error) {
    if (isCancelled(sessionId)) {
      throw error;
    }
    
    if (retryCount < maxRetries) {
      console.log(`Retrying chunk ${chunkIndex + 1} (attempt ${retryCount + 2})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return generateAudioChunk(text, voice, chunkIndex, sessionId, retryCount + 1);
    }
    throw error;
  }
}

// Optimized audio concatenation
function concatenateAudioBuffers(audioBuffers: ArrayBuffer[]): ArrayBuffer {
  if (audioBuffers.length === 1) {
    return audioBuffers[0];
  }

  const totalSize = audioBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
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
    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    // Handle different endpoints
    if (endpoint === 'progress') {
      const sessionId = url.searchParams.get('sessionId');
      if (!sessionId) {
        throw new Error('Session ID is required for progress endpoint');
      }
      
      const progress = getProgress(sessionId);
      return new Response(JSON.stringify(progress), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (endpoint === 'cancel') {
      const sessionId = url.searchParams.get('sessionId');
      if (!sessionId) {
        throw new Error('Session ID is required for cancel endpoint');
      }
      
      setCancelled(sessionId);
      clearProgress(sessionId);
      
      return new Response(JSON.stringify({ success: true, message: 'Generation cancelled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Main TTS generation endpoint
    const { text, language, chunkSize = 'auto', sessionId } = await req.json()

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration not found')
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text content is required')
    }

    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    // Clear any existing cancellation for this session
    clearCancellation(sessionId);

    // Check cache first
    const cacheKey = getCacheKey(text, language, chunkSize);
    const cachedAudio = getCachedAudio(cacheKey);
    
    if (cachedAudio) {
      console.log('Returning cached audio');
      updateProgress(sessionId, 100, 'Audio retrieved from cache');
      
      // Clean up progress after a delay
      setTimeout(() => clearProgress(sessionId), 2000);
      
      return new Response(JSON.stringify({ 
        audio_url: cachedAudio, 
        cached: true,
        session_id: sessionId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
    const chunkConfig = getOptimalChunkConfig(text.length, chunkSize)

    console.log('Processing text-to-speech request:', {
      textLength: text.length,
      language,
      voice,
      chunkSize,
      selectedConfig: chunkConfig,
      willChunk: text.length > chunkConfig.maxChars,
      sessionId
    });

    updateProgress(sessionId, 5, 'Initializing audio generation...');

    // Check if text needs chunking
    if (text.length <= chunkConfig.maxChars) {
      console.log('Text is within limits, processing as single request');
      updateProgress(sessionId, 20, 'Generating audio...');
      
      const audioData = await generateAudioChunk(text, voice, 0, sessionId);
      
      updateProgress(sessionId, 80, 'Uploading audio file...');
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const fileName = createSafeFilename(text, sessionId) + '.mp3';
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
        
        updateProgress(sessionId, 100, 'Audio generation completed (data URL)');
        
        // Cache the result
        setCachedAudio(cacheKey, audioUrl);
        
        // Clean up after delay
        setTimeout(() => clearProgress(sessionId), 2000);
        
        return new Response(JSON.stringify({ 
          audio_url: audioUrl,
          session_id: sessionId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      console.log('Single audio file uploaded successfully:', publicUrl);
      
      updateProgress(sessionId, 100, 'Audio generation completed successfully!');
      
      // Cache the result
      setCachedAudio(cacheKey, publicUrl);
      
      // Clean up after delay
      setTimeout(() => clearProgress(sessionId), 2000);

      return new Response(JSON.stringify({ 
        audio_url: publicUrl,
        session_id: sessionId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Text needs chunking
    console.log('Text exceeds limits, chunking required');
    const textChunks = chunkTextIntelligently(text, chunkConfig);
    console.log(`Split text into ${textChunks.length} chunks using ${chunkSize} config`);
    
    updateProgress(sessionId, 15, `Processing ${textChunks.length} text segments...`, 0, textChunks.length);

    // Generate audio for chunks with optimized batch processing
    const audioBuffers: ArrayBuffer[] = [];
    const batchSize = chunkConfig.batchSize === 'auto' ? 3 : chunkConfig.batchSize;
    
    for (let i = 0; i < textChunks.length; i += batchSize) {
      // Check for cancellation before each batch
      if (isCancelled(sessionId)) {
        clearProgress(sessionId);
        throw new Error('Audio generation was cancelled by user');
      }
      
      const batch = textChunks.slice(i, i + batchSize);
      const batchPromises = batch.map((chunk, batchIndex) => 
        generateAudioChunk(chunk, voice, i + batchIndex, sessionId)
      );
      
      try {
        const batchResults = await Promise.all(batchPromises);
        audioBuffers.push(...batchResults);
        
        const chunksProcessed = Math.min(i + batchSize, textChunks.length);
        const progressPercent = 15 + (chunksProcessed / textChunks.length) * 60;
        
        updateProgress(
          sessionId, 
          Math.round(progressPercent), 
          `Processed ${chunksProcessed}/${textChunks.length} segments...`,
          chunksProcessed,
          textChunks.length
        );
        
        console.log(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(textChunks.length / batchSize)}`);
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < textChunks.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        if (isCancelled(sessionId)) {
          clearProgress(sessionId);
          throw new Error('Audio generation was cancelled by user');
        }
        
        console.error(`Failed to generate audio for batch starting at chunk ${i + 1}:`, error);
        throw new Error(`Failed to generate audio for text segment starting at ${i + 1}: ${error.message}`);
      }
    }

    console.log(`Successfully generated ${audioBuffers.length} audio chunks`);
    
    updateProgress(sessionId, 80, 'Combining audio segments...');

    // Concatenate and upload
    const concatenatedAudio = concatenateAudioBuffers(audioBuffers);
    console.log(`Concatenated audio size: ${concatenatedAudio.byteLength} bytes`);

    updateProgress(sessionId, 90, 'Uploading final audio file...');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileName = createSafeFilename(text, sessionId) + `_${chunkSize}_chunked.mp3`;
    
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
      
      updateProgress(sessionId, 100, 'Audio generation completed (data URL)');
      
      // Cache the result
      setCachedAudio(cacheKey, audioUrl);
      
      // Clean up after delay
      setTimeout(() => clearProgress(sessionId), 2000);
      
      return new Response(JSON.stringify({ 
        audio_url: audioUrl,
        chunks_processed: textChunks.length,
        chunk_config: chunkSize,
        session_id: sessionId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName);

    console.log(`Chunked audio uploaded successfully: ${publicUrl} (${textChunks.length} chunks, ${chunkSize} config)`);
    
    updateProgress(sessionId, 100, `Audio generation completed! (${textChunks.length} segments processed)`);
    
    // Cache the result
    setCachedAudio(cacheKey, publicUrl);
    
    // Clean up after delay
    setTimeout(() => clearProgress(sessionId), 3000);

    return new Response(JSON.stringify({ 
      audio_url: publicUrl,
      chunks_processed: textChunks.length,
      chunk_config: chunkSize,
      session_id: sessionId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const url = new URL(req.url);
    const { sessionId } = await req.json().catch(() => ({}));
    
    if (sessionId) {
      clearProgress(sessionId);
      clearCancellation(sessionId);
    }
    
    console.error('Error in text-to-speech function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Text-to-speech generation failed. Try using a smaller chunk size for better performance.',
        session_id: sessionId
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
