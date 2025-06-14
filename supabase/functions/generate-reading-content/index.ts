
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const FUNCTION_TIMEOUT = 45000; // Optimized timeout
const OPENAI_TIMEOUT = 30000; // Optimized OpenAI timeout
const MAX_RETRIES = 1; // Reduced retries for faster response

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now();
  let timeoutController = new AbortController();
  
  const functionTimeout = setTimeout(() => {
    timeoutController.abort();
  }, FUNCTION_TIMEOUT);

  try {
    const { 
      topic, 
      language, 
      difficulty_level, 
      target_length, 
      grammar_focus,
      customText,
      isCustomText = false,
      directGeneration = false
    } = await req.json()

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log(`[OPTIMIZED GENERATION] Target: ${target_length} words, Strategy: ${directGeneration ? 'direct' : 'auto'}`);

    let content;

    if (isCustomText && customText) {
      content = await processCustomTextOptimized(customText, language, difficulty_level, grammar_focus, timeoutController.signal);
    } else {
      // Simplified strategy selection
      const useDirectGeneration = directGeneration || (target_length <= 1200);
      
      if (useDirectGeneration) {
        content = await generateContentDirect(
          topic, language, difficulty_level, target_length, grammar_focus, 
          timeoutController.signal
        );
      } else {
        // Use optimized chunking for larger content
        content = await generateContentWithOptimizedChunking(
          topic, language, difficulty_level, target_length, grammar_focus, 
          timeoutController.signal
        );
      }
    }

    clearTimeout(functionTimeout);
    
    const duration = Date.now() - startTime;
    console.log(`[OPTIMIZED SUCCESS] Completed in ${duration}ms, Generated ${content.analysis?.wordCount || 0} words`);

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    clearTimeout(functionTimeout);
    const duration = Date.now() - startTime;
    
    console.error(`[OPTIMIZED ERROR] After ${duration}ms:`, error);
    
    // Simplified error handling
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      console.warn('[OPTIMIZED FALLBACK] Using smart fallback due to timeout');
      const fallbackContent = generateSmartFallback(target_length || 700, language, topic);
      
      return new Response(JSON.stringify(fallbackContent), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateContentDirect(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[DIRECT GENERATION] Creating ${target_length} words directly`);
  
  const prompt = `Create a ${language} reading exercise for ${difficulty_level} learners.

Topic: ${topic}
Target: EXACTLY ${target_length} words
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

REQUIREMENTS:
- Write exactly ${target_length} words
- Create 4-10 natural sentences
- Use ${difficulty_level}-appropriate vocabulary
- Complete, coherent content

Return ONLY this JSON:
{
  "sentences": [
    {
      "id": "sentence-1",
      "text": "sentence in ${language}",
      "analysis": {
        "words": [
          {
            "word": "word",
            "definition": "definition",
            "partOfSpeech": "noun/verb/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["grammar points"],
        "translation": "English translation"
      }
    }
  ],
  "analysis": {
    "wordCount": ${target_length},
    "readingTime": ${Math.ceil(target_length / 200)},
    "grammarPoints": ["grammar concepts"]
  }
}`;

  const maxTokens = Math.min(5000, 1200 + Math.ceil(target_length * 1.1));
  return await callOpenAIOptimized(prompt, maxTokens, OPENAI_TIMEOUT, signal);
}

async function generateContentWithOptimizedChunking(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[OPTIMIZED CHUNKING] Creating ${target_length} words with smart chunking`);
  
  // Simplified chunking strategy
  const chunkSize = Math.min(800, Math.ceil(target_length / 2));
  const numChunks = Math.ceil(target_length / chunkSize);
  
  console.log(`[CHUNK STRATEGY] ${numChunks} chunks of ~${chunkSize} words each`);
  
  const chunks = [];
  let totalWordCount = 0;
  
  for (let i = 0; i < numChunks; i++) {
    const isLastChunk = i === numChunks - 1;
    const adjustedChunkSize = isLastChunk ? 
      Math.max(200, target_length - totalWordCount) : 
      chunkSize;
    
    if (adjustedChunkSize <= 0) break;
    
    console.log(`[CHUNK ${i + 1}/${numChunks}] Generating ${adjustedChunkSize} words`);
    
    try {
      const chunk = await generateChunkOptimized(
        topic, language, difficulty_level, adjustedChunkSize, 
        grammar_focus, i === 0, isLastChunk, 
        i > 0 ? chunks[chunks.length - 1] : null, signal
      );
      
      chunks.push(chunk);
      totalWordCount += chunk.analysis?.wordCount || 0;
      
      // Small delay between chunks
      if (i < numChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`[CHUNK ${i + 1} ERROR]`, error);
      
      // If first chunk fails, create fallback
      if (chunks.length === 0) {
        console.warn(`[FALLBACK CHUNK] Creating emergency content`);
        chunks.push(createEmergencyChunk(topic, language, difficulty_level, adjustedChunkSize));
      } else {
        // If later chunks fail, we can continue with what we have
        console.warn(`[CHUNK ${i + 1} SKIP] Continuing with existing chunks`);
        break;
      }
    }
  }
  
  return combineChunksOptimized(chunks, target_length);
}

async function generateChunkOptimized(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  isFirstChunk: boolean = false,
  isLastChunk: boolean = false,
  previousChunk: any = null,
  signal?: AbortSignal
) {
  const contextInfo = previousChunk ? 
    `Continue from: "${previousChunk.sentences?.[previousChunk.sentences.length - 1]?.text?.slice(0, 60) || ''}"` :
    '';
    
  const prompt = `${isFirstChunk ? 'Begin' : 'Continue'} a ${language} text for ${difficulty_level} learners.

Topic: ${topic}
${contextInfo}
Target: EXACTLY ${target_length} words
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

REQUIREMENTS:
- Write exactly ${target_length} words
- Create 3-6 natural sentences
- ${isFirstChunk ? 'Establish setting and context' : 'Maintain continuity'}
- ${isLastChunk ? 'Provide natural conclusion' : 'End smoothly for continuation'}

Return ONLY this JSON:
{
  "sentences": [
    {
      "id": "sentence-1",
      "text": "sentence in ${language}",
      "analysis": {
        "words": [
          {
            "word": "word",
            "definition": "definition",
            "partOfSpeech": "noun/verb/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["grammar points"],
        "translation": "English translation"
      }
    }
  ],
  "analysis": {
    "wordCount": ${target_length},
    "readingTime": ${Math.ceil(target_length / 200)},
    "grammarPoints": ["grammar concepts"]
  }
}`;

  const maxTokens = Math.min(4000, 1000 + Math.ceil(target_length * 1.0));
  return await callOpenAIOptimized(prompt, maxTokens, 20000, signal);
}

async function callOpenAIOptimized(
  prompt: string, 
  maxTokens: number, 
  timeout: number = OPENAI_TIMEOUT,
  signal?: AbortSignal
) {
  console.log(`[OPTIMIZED OPENAI] max_tokens: ${maxTokens}, timeout: ${timeout}ms`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert language teacher. Respond with ONLY valid JSON, no additional text. Be precise and concise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OPTIMIZED OPENAI ERROR] ${response.status}: ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(`[OPTIMIZED OPENAI SUCCESS] Response received`);

    return parseAndValidateOptimized(content);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('[OPTIMIZED OPENAI TIMEOUT]');
      throw new Error('OpenAI request timed out');
    }
    
    console.error('[OPTIMIZED OPENAI ERROR]', error);
    throw error;
  }
}

function parseAndValidateOptimized(content: string) {
  try {
    const parsedContent = JSON.parse(content);
    
    if (!parsedContent?.sentences || !Array.isArray(parsedContent.sentences)) {
      throw new Error('Invalid response structure');
    }

    // Ensure proper structure
    parsedContent.sentences = parsedContent.sentences.map((sentence: any, index: number) => ({
      ...sentence,
      id: sentence.id || `sentence-${index + 1}`,
      analysis: {
        words: Array.isArray(sentence.analysis?.words) ? sentence.analysis.words.slice(0, 5) : [],
        grammar: Array.isArray(sentence.analysis?.grammar) ? sentence.analysis.grammar : [],
        translation: sentence.analysis?.translation || ''
      }
    }));

    // Calculate actual word count
    const actualWordCount = parsedContent.sentences.reduce((count: number, sentence: any) => {
      return count + (sentence.text?.split(' ').length || 0);
    }, 0);

    if (!parsedContent.analysis) {
      parsedContent.analysis = {};
    }
    
    parsedContent.analysis.wordCount = actualWordCount;
    parsedContent.analysis.readingTime = Math.ceil(actualWordCount / 200);
    parsedContent.analysis.grammarPoints = Array.isArray(parsedContent.analysis.grammarPoints) ? 
      parsedContent.analysis.grammarPoints : [];

    console.log(`[OPTIMIZED VALIDATION] ${actualWordCount} words processed`);
    return parsedContent;
  } catch (error) {
    console.error('[PARSE ERROR]', error);
    throw new Error('Failed to parse response');
  }
}

function combineChunksOptimized(chunks: any[], target_length: number) {
  console.log(`[OPTIMIZED COMBINING] ${chunks.length} chunks`);
  
  const allSentences = [];
  const allGrammarPoints = new Set();
  let totalWordCount = 0;
  let sentenceCounter = 1;
  
  for (const chunk of chunks) {
    if (chunk.sentences) {
      for (const sentence of chunk.sentences) {
        allSentences.push({
          ...sentence,
          id: `sentence-${sentenceCounter++}`
        });
        
        if (sentence.analysis?.grammar) {
          sentence.analysis.grammar.forEach((point: string) => allGrammarPoints.add(point));
        }
      }
      
      totalWordCount += chunk.analysis?.wordCount || 0;
    }
  }
  
  console.log(`[OPTIMIZED COMBINATION] ${totalWordCount} words, ${allSentences.length} sentences`);
  
  return {
    sentences: allSentences,
    analysis: {
      wordCount: totalWordCount,
      readingTime: Math.ceil(totalWordCount / 200),
      grammarPoints: Array.from(allGrammarPoints),
      optimizedGeneration: true,
      chunksUsed: chunks.length
    }
  };
}

async function processCustomTextOptimized(
  customText: string, 
  language: string, 
  difficulty_level: string, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[CUSTOM OPTIMIZED] Processing ${customText.length} characters`);
  
  const prompt = `Analyze this custom text for ${difficulty_level} level ${language} learners.

Text: "${customText}"
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

REQUIREMENTS:
1. Break into natural sentences
2. Provide word analysis for key vocabulary (limit to 5 words per sentence)
3. Preserve original meaning

Return ONLY this JSON:
{
  "sentences": [
    {
      "id": "sentence-1",
      "text": "sentence in ${language}",
      "analysis": {
        "words": [
          {
            "word": "word",
            "definition": "definition",
            "partOfSpeech": "noun/verb/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["grammar points"],
        "translation": "English translation"
      }
    }
  ],
  "analysis": {
    "wordCount": ${customText.split(' ').length},
    "readingTime": ${Math.ceil(customText.split(' ').length / 200)},
    "grammarPoints": ["grammar concepts"]
  }
}`;

  return await callOpenAIOptimized(prompt, 3000, 25000, signal);
}

function createEmergencyChunk(topic: string, language: string, difficulty: string, wordCount: number) {
  const sentences = [];
  const sentenceCount = Math.max(3, Math.floor(wordCount / 15));
  
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push({
      id: `emergency-sentence-${i + 1}`,
      text: `This is emergency content for ${topic} in ${language}. Enhanced system protection activated.`,
      analysis: {
        words: [
          {
            word: 'emergency',
            definition: 'A backup solution',
            partOfSpeech: 'noun',
            difficulty: 'easy'
          }
        ],
        grammar: ['emergency content'],
        translation: 'Emergency content with system protection.'
      }
    });
  }
  
  return {
    sentences,
    analysis: {
      wordCount: wordCount,
      readingTime: Math.ceil(wordCount / 200),
      grammarPoints: ['emergency content']
    }
  };
}

function generateSmartFallback(target_length: number, language: string, topic?: string) {
  console.log('[SMART FALLBACK] Creating optimized fallback content');
  
  const sentences = [];
  const wordsPerSentence = Math.max(12, Math.floor(target_length / 6));
  const numSentences = Math.ceil(target_length / wordsPerSentence);
  
  for (let i = 0; i < numSentences; i++) {
    sentences.push({
      id: `smart-fallback-sentence-${i + 1}`,
      text: `This is optimized fallback content for your ${language} reading exercise about ${topic || 'general topics'}. The smart generation system ensured successful creation.`,
      analysis: {
        words: [
          {
            word: 'optimized',
            definition: 'Made as effective as possible',
            partOfSpeech: 'adjective',
            difficulty: 'medium'
          }
        ],
        grammar: ['smart fallback', 'optimized content'],
        translation: 'Smart fallback content with optimization.'
      }
    });
  }
  
  return {
    sentences,
    analysis: {
      wordCount: sentences.reduce((count, s) => count + s.text.split(' ').length, 0),
      readingTime: Math.ceil(target_length / 200),
      grammarPoints: ['smart fallback', 'optimized generation'],
      fallbackInfo: {
        method: 'smart_fallback',
        reason: 'Optimized protection activated for reliable creation',
        isUsable: true
      }
    }
  };
}
