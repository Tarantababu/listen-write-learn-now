
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { text, language } = await req.json();

    if (!text || !language) {
      throw new Error('Text and language are required');
    }
    
    // Always use English voices for optimal audio quality regardless of selected language
    // This will maintain the language parameter for database relationships only
    const voiceSettings = {
      voice: 'nova',       // Best all-purpose voice
      model: 'tts-1-hd',   // Highest quality model
      speed: 1.0           // Normal speed
    };
    
    // Enhanced text processing for optimal TTS quality
    let processedText = text;
    
    // For Spanish text, add "[in English]:" prefix to ensure proper processing in English
    if (language.toLowerCase() === 'spanish') {
      processedText = `[in English]: ${text}`;
    }
    
    console.log(`Generating speech for text (length: ${processedText.length}), using voice: ${voiceSettings.voice}, model: ${voiceSettings.model}`);

    // Split long text into chunks if needed (max 300 chars)
    const textChunks = splitTextIntoChunks(processedText, 300);
    const audioBuffers = [];

    for (const chunk of textChunks) {
      // Call OpenAI API with optimized settings for each chunk
      // Using English voices only, not passing language parameter to the API
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: voiceSettings.model,
          voice: voiceSettings.voice,
          input: chunk,
          response_format: 'mp3',
          speed: voiceSettings.speed
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, response.statusText);
        console.error('OpenAI API error details:', errorText);
        throw new Error(`Failed to generate speech: ${errorText}`);
      }

      const audioContent = await response.arrayBuffer();
      audioBuffers.push(new Uint8Array(audioContent));
    }

    // Combine audio chunks if multiple
    let finalAudio;
    if (audioBuffers.length === 1) {
      finalAudio = audioBuffers[0];
    } else {
      // In a real implementation, you would concatenate MP3 files properly
      // This is simplified; in production use proper MP3 concatenation library
      finalAudio = concatUint8Arrays(audioBuffers);
    }
    
    // Convert to base64 string safely
    let binaryString = '';
    finalAudio.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    const base64Audio = btoa(binaryString);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error generating speech:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

// Helper function to split text into chunks at logical sentence boundaries
function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by sentences (periods, question marks, exclamation points)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length === 0) {
    // If no sentence breaks, fall back to splitting by comma
    const phrases = text.split(/,\s*/);
    for (const phrase of phrases) {
      if (currentChunk.length + phrase.length + 1 <= maxChunkSize) {
        currentChunk += (currentChunk ? ', ' : '') + phrase;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = phrase;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
  } else {
    // Process sentence by sentence
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxChunkSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        // If single sentence is too long, split it further
        if (sentence.length > maxChunkSize) {
          const subChunks = splitLongSentence(sentence, maxChunkSize);
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = sentence;
        }
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
  }
  
  return chunks;
}

// Helper to split a long sentence that exceeds max size
function splitLongSentence(sentence: string, maxSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by commas, conjunctions, or other natural breaks
  const fragments = sentence.split(/,|\sand\s|\sor\s|\sbut\s|\sbecause\s|\swhile\s/);
  
  for (const fragment of fragments) {
    if (currentChunk.length + fragment.length + 2 <= maxSize) {
      currentChunk += (currentChunk ? ', ' : '') + fragment;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // If single fragment still too long, split arbitrarily
      if (fragment.length > maxSize) {
        let i = 0;
        while (i < fragment.length) {
          const end = Math.min(i + maxSize, fragment.length);
          // Try to break at a space if possible
          const breakAt = fragment.substring(i, end).lastIndexOf(' ') + i;
          const chunkEnd = breakAt > i ? breakAt : end;
          chunks.push(fragment.substring(i, chunkEnd));
          i = chunkEnd + 1;
        }
      } else {
        currentChunk = fragment;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Helper function to concatenate Uint8Arrays
function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  // Calculate total length
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  
  // Create new array with combined length
  const result = new Uint8Array(totalLength);
  
  // Copy each array into the result
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}
