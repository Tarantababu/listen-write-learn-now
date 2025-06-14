
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const FUNCTION_TIMEOUT = 55000; // 55 seconds (5s buffer before Supabase's 60s limit)
const OPENAI_TIMEOUT = 30000; // 30 seconds per OpenAI call
const MAX_RETRIES = 2;
const CHUNK_PROCESSING_DELAY = 500; // Reduced delay between chunks

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now();
  let timeoutController = new AbortController();
  
  // Set function-level timeout
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
      isCustomText = false
    } = await req.json()

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log(`[GENERATION START] Target: ${target_length} words, Language: ${language}, Custom: ${isCustomText}`);

    let content;

    if (isCustomText && customText) {
      content = await processCustomTextOptimized(customText, language, difficulty_level, grammar_focus, timeoutController.signal);
    } else {
      // Use optimized generation strategy
      if (target_length > 1500) {
        content = await generateContentWithOptimizedChunking(
          topic, language, difficulty_level, target_length, grammar_focus, 
          timeoutController.signal, startTime
        );
      } else {
        content = await generateContentDirectly(
          topic, language, difficulty_level, target_length, grammar_focus, 
          timeoutController.signal
        );
      }
    }

    clearTimeout(functionTimeout);
    
    const duration = Date.now() - startTime;
    console.log(`[GENERATION SUCCESS] Completed in ${duration}ms, Generated ${content.analysis?.wordCount || 0} words`);

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    clearTimeout(functionTimeout);
    const duration = Date.now() - startTime;
    
    console.error(`[GENERATION ERROR] After ${duration}ms:`, error);
    
    // Return graceful degradation response for timeout/abort errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new Response(JSON.stringify({
        error: 'Content generation timed out. Please try a shorter length or try again.',
        fallback: generateFallbackContent(target_length || 700, language)
      }), {
        status: 408,
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

async function generateContentWithOptimizedChunking(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  signal?: AbortSignal,
  startTime?: number
) {
  console.log(`[OPTIMIZED CHUNKING] Starting for ${target_length} words`);
  
  // Calculate optimal chunking strategy
  const chunkStrategy = calculateOptimalChunkStrategy(target_length);
  const { chunkSize, numChunks, useParallel } = chunkStrategy;
  
  console.log(`[CHUNK STRATEGY] ${numChunks} chunks of ~${chunkSize} words, parallel: ${useParallel}`);
  
  // Generate story outline with timeout
  let outline;
  try {
    outline = await Promise.race([
      generateSimpleOutline(topic, numChunks, language),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Outline timeout')), 8000)
      )
    ]);
  } catch (error) {
    console.warn('[OUTLINE FALLBACK] Using simple fallback');
    outline = createSimpleFallbackOutline(topic, numChunks);
  }
  
  const chunks = [];
  let totalWordCount = 0;
  
  if (useParallel && numChunks <= 3) {
    // Parallel processing for smaller chunk counts
    console.log('[PARALLEL PROCESSING] Generating chunks in parallel');
    const chunkPromises = [];
    
    for (let i = 0; i < numChunks; i++) {
      const chunkTopic = outline.sections[i] || `${topic} - Part ${i + 1}`;
      const isLastChunk = i === numChunks - 1;
      const adjustedChunkSize = isLastChunk ? target_length - (chunkSize * i) : chunkSize;
      
      if (adjustedChunkSize <= 0) break;
      
      chunkPromises.push(
        generateOptimizedChunk(
          chunkTopic, language, difficulty_level, adjustedChunkSize, 
          grammar_focus, i === 0, isLastChunk, null, outline, signal
        )
      );
    }
    
    try {
      const parallelChunks = await Promise.all(chunkPromises);
      chunks.push(...parallelChunks);
    } catch (error) {
      console.warn('[PARALLEL FALLBACK] Switching to sequential processing');
      // Fall back to sequential if parallel fails
      return await generateChunksSequentially(
        topic, language, difficulty_level, target_length, grammar_focus, 
        outline, signal, startTime
      );
    }
  } else {
    // Sequential processing with time management
    return await generateChunksSequentially(
      topic, language, difficulty_level, target_length, grammar_focus, 
      outline, signal, startTime
    );
  }
  
  return combineChunksOptimized(chunks, target_length);
}

async function generateChunksSequentially(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  outline?: any,
  signal?: AbortSignal,
  startTime?: number
) {
  const chunkStrategy = calculateOptimalChunkStrategy(target_length);
  const { chunkSize, numChunks } = chunkStrategy;
  
  const chunks = [];
  let totalWordCount = 0;
  
  for (let i = 0; i < numChunks; i++) {
    // Check if we're running out of time
    if (startTime && (Date.now() - startTime) > FUNCTION_TIMEOUT - 15000) {
      console.warn(`[TIME LIMIT] Stopping at chunk ${i + 1}/${numChunks} due to time constraints`);
      break;
    }
    
    const chunkTopic = outline?.sections[i] || `${topic} - Part ${i + 1}`;
    const isLastChunk = i === numChunks - 1;
    const adjustedChunkSize = isLastChunk ? 
      Math.max(300, target_length - totalWordCount) : 
      chunkSize;
    
    if (adjustedChunkSize <= 0) break;
    
    console.log(`[CHUNK ${i + 1}/${numChunks}] Generating ${adjustedChunkSize} words`);
    
    try {
      const chunk = await generateOptimizedChunk(
        chunkTopic, language, difficulty_level, adjustedChunkSize, 
        grammar_focus, i === 0, isLastChunk, 
        i > 0 ? chunks[chunks.length - 1] : null, outline, signal
      );
      
      chunks.push(chunk);
      totalWordCount += chunk.analysis?.wordCount || 0;
      
      // Adaptive delay based on progress
      if (i < numChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, CHUNK_PROCESSING_DELAY));
      }
    } catch (error) {
      console.error(`[CHUNK ${i + 1} ERROR]`, error);
      
      // Try to continue with remaining chunks unless it's a critical error
      if (error.name === 'AbortError' || chunks.length === 0) {
        throw error;
      }
      
      console.warn(`[CHUNK ${i + 1} SKIP] Continuing with existing chunks`);
      break;
    }
  }
  
  if (chunks.length === 0) {
    throw new Error('No chunks were successfully generated');
  }
  
  return combineChunksOptimized(chunks, target_length);
}

function calculateOptimalChunkStrategy(target_length: number) {
  // Optimized chunking based on target length and performance characteristics
  if (target_length <= 1500) {
    return { chunkSize: target_length, numChunks: 1, useParallel: false };
  }
  
  if (target_length <= 2500) {
    return { chunkSize: 800, numChunks: Math.ceil(target_length / 800), useParallel: true };
  }
  
  if (target_length <= 3500) {
    return { chunkSize: 900, numChunks: Math.ceil(target_length / 900), useParallel: false };
  }
  
  // For very long content, use larger chunks to reduce API calls
  return { 
    chunkSize: 1000, 
    numChunks: Math.min(5, Math.ceil(target_length / 1000)), 
    useParallel: false 
  };
}

async function generateSimpleOutline(topic: string, numChunks: number, language: string) {
  const prompt = `Create a simple story outline for "${topic}" in ${language}.
Return ONLY this JSON:
{
  "sections": [${Array(numChunks).fill(0).map((_, i) => `"Section ${i + 1} description"`).join(', ')}],
  "theme": "main theme"
}`;

  return await callOpenAIOptimized(prompt, 800, 3000);
}

function createSimpleFallbackOutline(topic: string, numChunks: number) {
  const sections = [];
  const themes = ['introduction', 'development', 'conflict', 'resolution', 'conclusion'];
  
  for (let i = 0; i < numChunks; i++) {
    const themeIndex = Math.floor((i / numChunks) * themes.length);
    const theme = themes[Math.min(themeIndex, themes.length - 1)];
    sections.push(`${topic} - ${theme} (Part ${i + 1})`);
  }
  
  return { sections, theme: `Story about ${topic}` };
}

async function generateOptimizedChunk(
  chunkTopic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  isFirstChunk: boolean = false,
  isLastChunk: boolean = false,
  previousChunk: any = null,
  outline: any = null,
  signal?: AbortSignal
) {
  const contextInfo = previousChunk ? 
    `Continue from: "${previousChunk.sentences?.[previousChunk.sentences.length - 1]?.text?.slice(0, 100) || ''}"` :
    '';
    
  const prompt = `${isFirstChunk ? 'Begin' : 'Continue'} a ${language} story for ${difficulty_level} learners.

Topic: ${chunkTopic}
${contextInfo}
Target: EXACTLY ${target_length} words
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

Requirements:
- Write exactly ${target_length} words
- Create 4-10 natural sentences
- Use ${difficulty_level}-appropriate vocabulary
- ${isFirstChunk ? 'Establish setting' : 'Maintain continuity'}
- ${isLastChunk ? 'Provide conclusion' : 'Connect smoothly to next part'}

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

  const maxTokens = calculateOptimizedTokenLimit(target_length);
  return await callOpenAIOptimized(prompt, maxTokens, OPENAI_TIMEOUT, signal);
}

function calculateOptimizedTokenLimit(target_length: number): number {
  // More conservative token calculation to prevent truncation
  const baseTokens = 1500;
  const contentTokens = Math.ceil(target_length * 1.5); // Reduced multiplier
  const analysisTokens = Math.ceil(target_length * 0.4); // Reduced analysis tokens
  return Math.min(8000, baseTokens + contentTokens + analysisTokens); // Lower max limit
}

async function callOpenAIOptimized(
  prompt: string, 
  maxTokens: number, 
  timeout: number = OPENAI_TIMEOUT,
  signal?: AbortSignal
) {
  console.log(`[OPENAI CALL] max_tokens: ${maxTokens}, timeout: ${timeout}ms`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Combine signals if provided
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
            content: 'You are an expert language teacher. Respond with ONLY valid JSON, no additional text. Ensure word analysis only includes words that appear in the text. Complete all JSON structures fully.'
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
      console.error(`[OPENAI ERROR] ${response.status}: ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(`[OPENAI SUCCESS] Response length: ${content.length}`);

    return parseAndValidateResponse(content);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('[OPENAI TIMEOUT] Request aborted due to timeout');
      throw new Error('OpenAI request timed out');
    }
    
    console.error('[OPENAI ERROR]', error);
    throw error;
  }
}

function parseAndValidateResponse(content: string) {
  let parsedContent;
  
  try {
    parsedContent = JSON.parse(content);
  } catch (parseError) {
    console.error('[JSON PARSE ERROR] Attempting recovery');
    
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsedContent = JSON.parse(jsonMatch[0]);
        console.log('[JSON RECOVERY] Successfully recovered JSON');
      } catch (recoveryError) {
        throw new Error('Failed to parse OpenAI response as valid JSON');
      }
    } else {
      throw new Error('No valid JSON structure found in OpenAI response');
    }
  }

  // Validate response structure
  if (!parsedContent || typeof parsedContent !== 'object') {
    throw new Error('Invalid response structure: not an object');
  }

  if (!parsedContent.sentences || !Array.isArray(parsedContent.sentences)) {
    throw new Error('Invalid response structure: missing sentences array');
  }

  // Ensure proper structure and calculate actual word count
  parsedContent.sentences = parsedContent.sentences.map((sentence: any, index: number) => ({
    ...sentence,
    id: sentence.id || `sentence-${index + 1}`,
    analysis: {
      words: sentence.analysis?.words || [],
      grammar: sentence.analysis?.grammar || [],
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
  parsedContent.analysis.grammarPoints = parsedContent.analysis.grammarPoints || [];

  console.log(`[VALIDATION SUCCESS] ${actualWordCount} words processed`);
  return parsedContent;
}

function combineChunksOptimized(chunks: any[], target_length: number) {
  console.log(`[COMBINING] ${chunks.length} chunks`);
  
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
  
  console.log(`[COMBINATION SUCCESS] ${totalWordCount} words, ${allSentences.length} sentences`);
  
  return {
    sentences: allSentences,
    analysis: {
      wordCount: totalWordCount,
      readingTime: Math.ceil(totalWordCount / 200),
      grammarPoints: Array.from(allGrammarPoints)
    }
  };
}

async function generateContentDirectly(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[DIRECT GENERATION] ${target_length} words`);
  
  const prompt = `Create a ${language} reading exercise for ${difficulty_level} learners.

Topic: ${topic}
Target: EXACTLY ${target_length} words
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

Requirements:
- Write exactly ${target_length} words
- Create 6-12 natural sentences
- Use ${difficulty_level}-appropriate vocabulary
- Include varied sentence structures

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

  const maxTokens = calculateOptimizedTokenLimit(target_length);
  return await callOpenAIOptimized(prompt, maxTokens, OPENAI_TIMEOUT, signal);
}

async function processCustomTextOptimized(
  customText: string, 
  language: string, 
  difficulty_level: string, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[CUSTOM TEXT] Processing ${customText.length} characters`);
  
  const prompt = `Analyze this custom text for ${difficulty_level} level ${language} learners.

Text: "${customText}"
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

Requirements:
1. Break into natural sentences
2. Provide word analysis for key vocabulary
3. Preserve original meaning
4. Fix minor errors while maintaining voice

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

  return await callOpenAIOptimized(prompt, 4000, OPENAI_TIMEOUT, signal);
}

function generateFallbackContent(target_length: number, language: string) {
  // Generate a simple fallback content structure
  const sentences = [];
  const wordsPerSentence = Math.max(8, Math.floor(target_length / 10));
  const numSentences = Math.ceil(target_length / wordsPerSentence);
  
  for (let i = 0; i < numSentences; i++) {
    sentences.push({
      id: `fallback-sentence-${i + 1}`,
      text: `[Content generation timed out. Please try again with a shorter length.]`,
      analysis: {
        words: [],
        grammar: [],
        translation: 'Content generation timed out. Please try again with a shorter length.'
      }
    });
  }
  
  return {
    sentences,
    analysis: {
      wordCount: target_length,
      readingTime: Math.ceil(target_length / 200),
      grammarPoints: ['timeout-fallback']
    }
  };
}
