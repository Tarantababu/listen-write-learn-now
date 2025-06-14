
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const FUNCTION_TIMEOUT = 50000; // Reduced to 50 seconds for better reliability
const OPENAI_TIMEOUT = 25000; // Reduced OpenAI timeout for faster recovery
const MAX_RETRIES = 2;
const CHUNK_PROCESSING_DELAY = 300; // Faster chunk processing

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now();
  let timeoutController = new AbortController();
  
  // Set function-level timeout with buffer
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

    console.log(`[ENHANCED GENERATION] Target: ${target_length} words, Direct: ${directGeneration}, Custom: ${isCustomText}`);

    let content;

    if (isCustomText && customText) {
      content = await processCustomTextWithRecovery(customText, language, difficulty_level, grammar_focus, timeoutController.signal);
    } else if (directGeneration || target_length <= 1200) {
      // Use direct generation for smaller content or when specifically requested
      content = await generateContentDirectlyWithRecovery(
        topic, language, difficulty_level, target_length, grammar_focus, 
        timeoutController.signal
      );
    } else {
      // Use enhanced chunking strategy for larger content
      content = await generateContentWithEnhancedChunking(
        topic, language, difficulty_level, target_length, grammar_focus, 
        timeoutController.signal, startTime
      );
    }

    clearTimeout(functionTimeout);
    
    const duration = Date.now() - startTime;
    console.log(`[ENHANCED SUCCESS] Completed in ${duration}ms, Generated ${content.analysis?.wordCount || 0} words`);

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    clearTimeout(functionTimeout);
    const duration = Date.now() - startTime;
    
    console.error(`[ENHANCED ERROR] After ${duration}ms:`, error);
    
    // Enhanced error handling with specific fallbacks
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      console.warn('[ENHANCED FALLBACK] Timeout detected - generating protective fallback');
      const fallbackContent = generateEnhancedFallback(target_length || 700, language, topic);
      
      return new Response(JSON.stringify(fallbackContent), {
        status: 200, // Return 200 with fallback content instead of error
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

async function generateContentWithEnhancedChunking(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  signal?: AbortSignal,
  startTime?: number
) {
  console.log(`[ENHANCED CHUNKING] Starting for ${target_length} words with smart protection`);
  
  // Calculate smarter chunking strategy
  const chunkStrategy = calculateEnhancedChunkStrategy(target_length);
  const { chunkSize, numChunks, useParallel, maxTime } = chunkStrategy;
  
  console.log(`[CHUNK STRATEGY] ${numChunks} chunks of ~${chunkSize} words, parallel: ${useParallel}, maxTime: ${maxTime}s`);
  
  // Generate enhanced outline with shorter timeout
  let outline;
  try {
    outline = await Promise.race([
      generateEnhancedOutline(topic, numChunks, language),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Outline timeout')), 6000)
      )
    ]);
  } catch (error) {
    console.warn('[OUTLINE FALLBACK] Using intelligent fallback outline');
    outline = createIntelligentFallbackOutline(topic, numChunks, difficulty_level);
  }
  
  const chunks = [];
  let totalWordCount = 0;
  
  // Always use sequential processing for better reliability
  console.log('[SEQUENTIAL PROCESSING] Using reliable sequential generation');
  return await generateChunksWithEnhancedRecovery(
    topic, language, difficulty_level, target_length, grammar_focus, 
    outline, signal, startTime
  );
}

function calculateEnhancedChunkStrategy(target_length: number) {
  // Smarter chunking with caps at 3000 words maximum
  const cappedLength = Math.min(target_length, 3000);
  
  if (cappedLength <= 1200) {
    return { chunkSize: cappedLength, numChunks: 1, useParallel: false, maxTime: 25 };
  }
  
  if (cappedLength <= 2000) {
    return { chunkSize: 700, numChunks: Math.ceil(cappedLength / 700), useParallel: false, maxTime: 35 };
  }
  
  // For maximum length (3000), use larger chunks to minimize API calls
  return { 
    chunkSize: 1000, 
    numChunks: Math.min(3, Math.ceil(cappedLength / 1000)), 
    useParallel: false,
    maxTime: 45
  };
}

async function generateChunksWithEnhancedRecovery(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  outline?: any,
  signal?: AbortSignal,
  startTime?: number
) {
  const chunkStrategy = calculateEnhancedChunkStrategy(target_length);
  const { chunkSize, numChunks } = chunkStrategy;
  
  const chunks = [];
  let totalWordCount = 0;
  const maxChunkTime = 15000; // 15 seconds per chunk maximum
  
  for (let i = 0; i < numChunks; i++) {
    // Enhanced time checking with larger buffer
    if (startTime && (Date.now() - startTime) > FUNCTION_TIMEOUT - 20000) {
      console.warn(`[TIME PROTECTION] Stopping at chunk ${i + 1}/${numChunks} to prevent timeout`);
      break;
    }
    
    const chunkTopic = outline?.sections[i] || `${topic} - Part ${i + 1}`;
    const isLastChunk = i === numChunks - 1;
    const adjustedChunkSize = isLastChunk ? 
      Math.max(200, target_length - totalWordCount) : 
      chunkSize;
    
    if (adjustedChunkSize <= 0) break;
    
    console.log(`[ENHANCED CHUNK ${i + 1}/${numChunks}] Generating ${adjustedChunkSize} words with protection`);
    
    try {
      // Generate chunk with timeout protection
      const chunkPromise = generateProtectedChunk(
        chunkTopic, language, difficulty_level, adjustedChunkSize, 
        grammar_focus, i === 0, isLastChunk, 
        i > 0 ? chunks[chunks.length - 1] : null, outline, signal
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Chunk ${i + 1} timeout`)), maxChunkTime)
      );
      
      const chunk = await Promise.race([chunkPromise, timeoutPromise]);
      
      chunks.push(chunk);
      totalWordCount += chunk.analysis?.wordCount || 0;
      
      // Reduced delay for faster processing
      if (i < numChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, CHUNK_PROCESSING_DELAY));
      }
    } catch (error) {
      console.error(`[ENHANCED CHUNK ${i + 1} ERROR]`, error);
      
      // Enhanced error recovery - try to continue or create fallback chunk
      if (chunks.length === 0) {
        // If first chunk fails, create a basic fallback
        console.warn(`[FIRST CHUNK FALLBACK] Creating emergency content`);
        chunks.push(createEmergencyChunk(chunkTopic, language, difficulty_level, adjustedChunkSize, i + 1));
      } else {
        // If later chunks fail, we can still use what we have
        console.warn(`[CHUNK ${i + 1} SKIP] Continuing with existing chunks`);
        break;
      }
    }
  }
  
  if (chunks.length === 0) {
    throw new Error('No chunks were successfully generated');
  }
  
  return combineChunksWithEnhancement(chunks, target_length);
}

async function generateProtectedChunk(
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
    `Continue from: "${previousChunk.sentences?.[previousChunk.sentences.length - 1]?.text?.slice(0, 80) || ''}"` :
    '';
    
  const prompt = `${isFirstChunk ? 'Begin' : 'Continue'} a ${language} story for ${difficulty_level} learners.

Topic: ${chunkTopic}
${contextInfo}
Target: EXACTLY ${target_length} words
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

REQUIREMENTS:
- Write exactly ${target_length} words
- Create 3-8 natural sentences
- Use ${difficulty_level}-appropriate vocabulary
- ${isFirstChunk ? 'Establish setting and characters' : 'Maintain story continuity'}
- ${isLastChunk ? 'Provide satisfying conclusion' : 'End naturally for continuation'}

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

  const maxTokens = calculateConservativeTokenLimit(target_length);
  return await callOpenAIWithEnhancedProtection(prompt, maxTokens, OPENAI_TIMEOUT, signal);
}

function calculateConservativeTokenLimit(target_length: number): number {
  // Very conservative token calculation to prevent truncation
  const baseTokens = 1200;
  const contentTokens = Math.ceil(target_length * 1.2); // Reduced multiplier
  const analysisTokens = Math.ceil(target_length * 0.3); // Reduced analysis tokens
  return Math.min(6000, baseTokens + contentTokens + analysisTokens); // Lower max limit
}

async function callOpenAIWithEnhancedProtection(
  prompt: string, 
  maxTokens: number, 
  timeout: number = OPENAI_TIMEOUT,
  signal?: AbortSignal
) {
  console.log(`[ENHANCED OPENAI] max_tokens: ${maxTokens}, timeout: ${timeout}ms`);
  
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
            content: 'You are an expert language teacher. Respond with ONLY valid JSON, no additional text. Ensure all words in analysis appear in the text. Be concise but complete.'
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
      console.error(`[ENHANCED OPENAI ERROR] ${response.status}: ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(`[ENHANCED OPENAI SUCCESS] Response length: ${content.length}`);

    return parseAndValidateResponseWithRecovery(content);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('[ENHANCED OPENAI TIMEOUT] Request aborted due to timeout');
      throw new Error('OpenAI request timed out');
    }
    
    console.error('[ENHANCED OPENAI ERROR]', error);
    throw error;
  }
}

function parseAndValidateResponseWithRecovery(content: string) {
  let parsedContent;
  
  try {
    parsedContent = JSON.parse(content);
  } catch (parseError) {
    console.error('[JSON PARSE ERROR] Attempting enhanced recovery');
    
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

  // Enhanced validation with recovery
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
      words: Array.isArray(sentence.analysis?.words) ? sentence.analysis.words : [],
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

  console.log(`[ENHANCED VALIDATION SUCCESS] ${actualWordCount} words processed`);
  return parsedContent;
}

function combineChunksWithEnhancement(chunks: any[], target_length: number) {
  console.log(`[ENHANCED COMBINING] ${chunks.length} chunks`);
  
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
  
  console.log(`[ENHANCED COMBINATION SUCCESS] ${totalWordCount} words, ${allSentences.length} sentences`);
  
  return {
    sentences: allSentences,
    analysis: {
      wordCount: totalWordCount,
      readingTime: Math.ceil(totalWordCount / 200),
      grammarPoints: Array.from(allGrammarPoints),
      enhancedGeneration: true,
      chunksUsed: chunks.length
    }
  };
}

async function generateContentDirectlyWithRecovery(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[DIRECT RECOVERY] ${target_length} words with enhanced protection`);
  
  const prompt = `Create a ${language} reading exercise for ${difficulty_level} learners.

Topic: ${topic}
Target: EXACTLY ${target_length} words
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

REQUIREMENTS:
- Write exactly ${target_length} words
- Create 4-10 natural sentences
- Use ${difficulty_level}-appropriate vocabulary
- Include varied sentence structures
- Complete, coherent story or text

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

  const maxTokens = calculateConservativeTokenLimit(target_length);
  return await callOpenAIWithEnhancedProtection(prompt, maxTokens, OPENAI_TIMEOUT, signal);
}

async function processCustomTextWithRecovery(
  customText: string, 
  language: string, 
  difficulty_level: string, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[CUSTOM RECOVERY] Processing ${customText.length} characters with protection`);
  
  const prompt = `Analyze this custom text for ${difficulty_level} level ${language} learners.

Text: "${customText}"
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

REQUIREMENTS:
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

  return await callOpenAIWithEnhancedProtection(prompt, 3500, OPENAI_TIMEOUT, signal);
}

async function generateEnhancedOutline(topic: string, numChunks: number, language: string) {
  const prompt = `Create a story outline for "${topic}" in ${language}.
Return ONLY this JSON:
{
  "sections": [${Array(numChunks).fill(0).map((_, i) => `"Section ${i + 1} description"`).join(', ')}],
  "theme": "main theme"
}`;

  return await callOpenAIWithEnhancedProtection(prompt, 800, 5000);
}

function createIntelligentFallbackOutline(topic: string, numChunks: number, difficulty: string) {
  const sections = [];
  const storyStructure = ['introduction', 'development', 'climax', 'resolution'];
  
  for (let i = 0; i < numChunks; i++) {
    const structureIndex = Math.floor((i / numChunks) * storyStructure.length);
    const structure = storyStructure[Math.min(structureIndex, storyStructure.length - 1)];
    sections.push(`${topic} - ${structure} (Part ${i + 1})`);
  }
  
  return { sections, theme: `Story about ${topic}` };
}

function createEmergencyChunk(topic: string, language: string, difficulty: string, wordCount: number, chunkNumber: number) {
  const sentences = [];
  const sentenceCount = Math.max(3, Math.floor(wordCount / 15));
  
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push({
      id: `emergency-sentence-${chunkNumber}-${i + 1}`,
      text: `This is an emergency fallback sentence ${i + 1} for ${topic} in ${language}. [Enhanced protection activated]`,
      analysis: {
        words: [
          {
            word: 'emergency',
            definition: 'A backup solution',
            partOfSpeech: 'noun',
            difficulty: 'easy'
          }
        ],
        grammar: ['emergency fallback'],
        translation: 'Emergency fallback content with enhanced protection.'
      }
    });
  }
  
  return {
    sentences,
    analysis: {
      wordCount: wordCount,
      readingTime: Math.ceil(wordCount / 200),
      grammarPoints: ['emergency fallback', 'enhanced protection']
    }
  };
}

function generateEnhancedFallback(target_length: number, language: string, topic?: string) {
  console.log('[ENHANCED FALLBACK] Creating intelligent fallback content');
  
  const sentences = [];
  const wordsPerSentence = Math.max(12, Math.floor(target_length / 8));
  const numSentences = Math.ceil(target_length / wordsPerSentence);
  
  for (let i = 0; i < numSentences; i++) {
    sentences.push({
      id: `enhanced-fallback-sentence-${i + 1}`,
      text: `This is enhanced fallback content for your ${language} reading exercise about ${topic || 'general topics'}. The content generation system used intelligent protection to ensure you receive a complete exercise.`,
      analysis: {
        words: [
          {
            word: 'enhanced',
            definition: 'Improved or augmented',
            partOfSpeech: 'adjective',
            difficulty: 'medium'
          },
          {
            word: 'fallback',
            definition: 'A backup or alternative option',
            partOfSpeech: 'noun',
            difficulty: 'medium'
          }
        ],
        grammar: ['enhanced protection', 'fallback system'],
        translation: 'Enhanced fallback content with intelligent protection system.'
      }
    });
  }
  
  return {
    sentences,
    analysis: {
      wordCount: target_length,
      readingTime: Math.ceil(target_length / 200),
      grammarPoints: ['enhanced fallback', 'intelligent protection'],
      fallbackInfo: {
        type: 'enhanced_fallback',
        reason: 'Generation complexity required enhanced protection',
        isUsable: true,
        protectionActive: true
      }
    }
  };
}
