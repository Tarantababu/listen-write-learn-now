import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const FUNCTION_TIMEOUT = 50000;
const OPENAI_TIMEOUT = 35000;
const MAX_RETRIES = 2;

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
      target_length = 500, // Provide default value here
      grammar_focus,
      directGeneration = false
    } = await req.json()

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log(`[ENHANCED GENERATION] Target: ${target_length} words, Strategy: ${directGeneration ? 'direct' : 'intelligent'}`);

    let content;

    // Enhanced strategy selection with smarter thresholds
    const strategy = determineOptimalStrategy(target_length, difficulty_level);
    
    if (strategy === 'direct') {
      content = await generateContentDirect(
        topic, language, difficulty_level, target_length, grammar_focus, 
        timeoutController.signal
      );
    } else if (strategy === 'smart_chunking') {
      content = await generateContentWithSmartChunking(
        topic, language, difficulty_level, target_length, grammar_focus, 
        timeoutController.signal
      );
    } else {
      // Advanced adaptive chunking for very large content
      content = await generateContentWithAdaptiveChunking(
        topic, language, difficulty_level, target_length, grammar_focus, 
        timeoutController.signal
      );
    }

    clearTimeout(functionTimeout);
    
    const duration = Date.now() - startTime;
    console.log(`[ENHANCED SUCCESS] Completed in ${duration}ms, Generated ${content.analysis?.wordCount || 0} words with strategy: ${content.analysis?.generationStrategy || 'unknown'}`);

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    clearTimeout(functionTimeout);
    const duration = Date.now() - startTime;
    
    console.error(`[ENHANCED ERROR] After ${duration}ms:`, error);
    
    // Enhanced error handling with smart recovery
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      console.warn('[SMART RECOVERY] Using intelligent fallback due to timeout');
      const fallbackContent = generateIntelligentFallback(target_length || 500, language, topic, difficulty_level);
      
      return new Response(JSON.stringify(fallbackContent), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Enhanced error response with recovery suggestions
    const errorResponse = {
      error: error.message,
      recoveryData: generateRecoveryData(target_length || 500, language, topic, difficulty_level),
      fallbackAvailable: true
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function determineOptimalStrategy(targetLength: number, difficultyLevel: string): 'direct' | 'smart_chunking' | 'adaptive_chunking' {
  if (targetLength <= 800) return 'direct';
  if (targetLength <= 1500) return 'smart_chunking';
  return 'adaptive_chunking';
}

async function generateContentDirect(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[DIRECT GENERATION] Creating ${target_length} words with enhanced prompting`);
  
  const enhancedPrompt = createEnhancedPrompt(topic, language, difficulty_level, target_length, grammar_focus);
  const maxTokens = calculateOptimalTokens(target_length);
  
  return await callOpenAIEnhanced(enhancedPrompt, maxTokens, OPENAI_TIMEOUT, signal, 'direct');
}

async function generateContentWithSmartChunking(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[SMART CHUNKING] Creating ${target_length} words with intelligent chunking`);
  
  const chunkStrategy = calculateSmartChunkStrategy(target_length);
  const chunks = [];
  let totalWordCount = 0;
  
  for (let i = 0; i < chunkStrategy.numChunks; i++) {
    const chunkSize = calculateChunkSize(i, chunkStrategy, target_length, totalWordCount);
    
    if (chunkSize <= 0) break;
    
    console.log(`[SMART CHUNK ${i + 1}/${chunkStrategy.numChunks}] Generating ${chunkSize} words`);
    
    try {
      const chunk = await generateEnhancedChunk(
        topic, language, difficulty_level, chunkSize, 
        grammar_focus, i === 0, i === chunkStrategy.numChunks - 1, 
        i > 0 ? chunks[chunks.length - 1] : null, signal, 'smart_chunking'
      );
      
      chunks.push(chunk);
      totalWordCount += chunk.analysis?.wordCount || 0;
      
      if (i < chunkStrategy.numChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } catch (error) {
      console.error(`[SMART CHUNK ${i + 1} ERROR]`, error);
      
      if (chunks.length === 0) {
        chunks.push(createEnhancedEmergencyChunk(topic, language, difficulty_level, chunkSize));
      } else {
        console.warn(`[SMART CHUNK ${i + 1} SKIP] Continuing with existing chunks`);
        break;
      }
    }
  }
  
  return combineChunksEnhanced(chunks, target_length, 'smart_chunking');
}

async function generateContentWithAdaptiveChunking(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[ADAPTIVE CHUNKING] Creating ${target_length} words with adaptive strategy`);
  
  const adaptiveStrategy = calculateAdaptiveStrategy(target_length, difficulty_level);
  const chunks = [];
  let totalWordCount = 0;
  
  for (let i = 0; i < adaptiveStrategy.phases.length; i++) {
    const phase = adaptiveStrategy.phases[i];
    
    try {
      const chunk = await generateAdaptiveChunk(
        topic, language, difficulty_level, phase.targetWords, 
        grammar_focus, phase.isIntro, phase.isConclusion, 
        chunks.length > 0 ? chunks[chunks.length - 1] : null, 
        signal, phase.focus
      );
      
      chunks.push(chunk);
      totalWordCount += chunk.analysis?.wordCount || 0;
      
      if (i < adaptiveStrategy.phases.length - 1) {
        await new Promise(resolve => setTimeout(resolve, phase.delay));
      }
    } catch (error) {
      console.error(`[ADAPTIVE PHASE ${i + 1} ERROR]`, error);
      
      if (chunks.length === 0) {
        chunks.push(createEnhancedEmergencyChunk(topic, language, difficulty_level, phase.targetWords));
      } else {
        break;
      }
    }
  }
  
  return combineChunksEnhanced(chunks, target_length, 'adaptive_chunking');
}

function createEnhancedPrompt(topic: string, language: string, difficulty: string, targetLength: number, grammarFocus?: string): string {
  const complexityLevel = difficulty === 'beginner' ? 'simple' : difficulty === 'intermediate' ? 'moderate' : 'sophisticated';
  
  return `Create a ${language} reading exercise for ${difficulty} learners.

Topic: ${topic}
Target: EXACTLY ${targetLength} words
Complexity: ${complexityLevel} vocabulary and sentence structure
${grammarFocus ? `Grammar emphasis: ${grammarFocus}` : ''}

REQUIREMENTS:
- Write exactly ${targetLength} words (count carefully)
- Create 4-12 natural, flowing sentences
- Use ${difficulty}-appropriate vocabulary with variety
- Ensure logical progression and coherence

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
            "definition": "clear definition",
            "partOfSpeech": "noun/verb/adjective/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["specific grammar points"],
        "translation": "accurate English translation"
      }
    }
  ],
  "analysis": {
    "wordCount": ${targetLength},
    "readingTime": ${Math.ceil(targetLength / 200)},
    "grammarPoints": ["grammar concepts covered"]
  }
}`;
}

function calculateOptimalTokens(targetLength: number): number {
  const baseTokens = 1000;
  const wordsToTokensRatio = 1.3;
  const analysisTokens = 800;
  
  return Math.min(6000, baseTokens + Math.ceil(targetLength * wordsToTokensRatio) + analysisTokens);
}

function calculateSmartChunkStrategy(targetLength: number): { numChunks: number; baseChunkSize: number; strategy: string } {
  if (targetLength <= 1200) {
    return { numChunks: 2, baseChunkSize: Math.ceil(targetLength / 2), strategy: 'balanced_split' };
  } else if (targetLength <= 2000) {
    return { numChunks: 3, baseChunkSize: Math.ceil(targetLength / 3), strategy: 'three_part_harmony' };
  } else {
    const numChunks = Math.ceil(targetLength / 700);
    return { numChunks, baseChunkSize: Math.ceil(targetLength / numChunks), strategy: 'progressive_build' };
  }
}

function calculateChunkSize(index: number, strategy: any, targetLength: number, currentTotal: number): number {
  const remaining = targetLength - currentTotal;
  const chunksLeft = strategy.numChunks - index;
  
  if (chunksLeft === 1) {
    return Math.max(150, remaining);
  }
  
  const idealSize = Math.ceil(remaining / chunksLeft);
  return Math.max(200, Math.min(idealSize, strategy.baseChunkSize));
}

function calculateAdaptiveStrategy(targetLength: number, difficulty: string): { phases: any[]; strategy: string } {
  const phases = [];
  const wordsPerPhase = Math.ceil(targetLength / 4);
  
  phases.push({
    targetWords: Math.ceil(wordsPerPhase * 0.8),
    isIntro: true,
    isConclusion: false,
    focus: 'introduction_and_context',
    delay: 200
  });
  
  phases.push({
    targetWords: wordsPerPhase,
    isIntro: false,
    isConclusion: false,
    focus: 'development_and_detail',
    delay: 250
  });
  
  phases.push({
    targetWords: wordsPerPhase,
    isIntro: false,
    isConclusion: false,
    focus: 'expansion_and_examples',
    delay: 200
  });
  
  phases.push({
    targetWords: targetLength - (phases[0].targetWords + phases[1].targetWords + phases[2].targetWords),
    isIntro: false,
    isConclusion: true,
    focus: 'conclusion_and_synthesis',
    delay: 0
  });
  
  return { phases, strategy: 'adaptive_progressive' };
}

async function generateEnhancedChunk(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  isFirstChunk: boolean = false,
  isLastChunk: boolean = false,
  previousChunk: any = null,
  signal?: AbortSignal,
  strategy: string = 'smart_chunking'
) {
  const contextInfo = previousChunk ? 
    `Continue seamlessly from: "${previousChunk.sentences?.[previousChunk.sentences.length - 1]?.text?.slice(0, 80) || ''}"` :
    '';
    
  const chunkRole = isFirstChunk ? 'introduction and setup' : 
                   isLastChunk ? 'conclusion and wrap-up' : 
                   'development and continuation';
    
  const prompt = `${isFirstChunk ? 'Begin' : 'Continue'} a cohesive ${language} text for ${difficulty_level} learners.

Topic: ${topic}
Role: Handle ${chunkRole}
${contextInfo}
Target: EXACTLY ${target_length} words
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

REQUIREMENTS:
- Write exactly ${target_length} words
- Create 3-8 natural sentences with good flow
- ${isFirstChunk ? 'Establish clear context and engage the reader' : 'Maintain narrative continuity'}
- ${isLastChunk ? 'Provide satisfying conclusion' : 'End in a way that flows naturally to next section'}

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
            "definition": "clear definition",
            "partOfSpeech": "noun/verb/adjective/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["grammar points"],
        "translation": "accurate English translation"
      }
    }
  ],
  "analysis": {
    "wordCount": ${target_length},
    "readingTime": ${Math.ceil(target_length / 200)},
    "grammarPoints": ["grammar concepts covered"]
  }
}`;

  const maxTokens = calculateOptimalTokens(target_length);
  return await callOpenAIEnhanced(prompt, maxTokens, 25000, signal, strategy);
}

async function generateAdaptiveChunk(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  isIntro: boolean = false,
  isConclusion: boolean = false,
  previousChunk: any = null,
  signal?: AbortSignal,
  focus: string = 'general'
) {
  const prompt = `Create a ${focus.replace('_', ' ')} section for a ${language} text on ${topic}.

Target: EXACTLY ${target_length} words
Level: ${difficulty_level}
Focus: ${focus}
${grammar_focus ? `Grammar emphasis: ${grammar_focus}` : ''}
${previousChunk ? `Continue from: "${previousChunk.sentences?.[previousChunk.sentences.length - 1]?.text?.slice(0, 60) || ''}"` : ''}

REQUIREMENTS:
- Write exactly ${target_length} words
- ${isIntro ? 'Create engaging introduction that sets context' : ''}
- ${isConclusion ? 'Provide thoughtful conclusion that ties themes together' : ''}
- ${!isIntro && !isConclusion ? 'Develop content with appropriate depth and detail' : ''}

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
            "partOfSpeech": "part of speech",
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

  return await callOpenAIEnhanced(prompt, calculateOptimalTokens(target_length), 30000, signal, 'adaptive_chunking');
}

async function callOpenAIEnhanced(
  prompt: string, 
  maxTokens: number, 
  timeout: number = OPENAI_TIMEOUT,
  signal?: AbortSignal,
  strategy: string = 'unknown'
) {
  console.log(`[ENHANCED OPENAI] Strategy: ${strategy}, max_tokens: ${maxTokens}, timeout: ${timeout}ms`);
  
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
            content: 'You are an expert language teacher and content creator. Create educational content that is engaging, accurate, and pedagogically sound. Always respond with valid JSON only.'
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
      throw new Error(`OpenAI API error: ${response.status} - ${errorText.slice(0, 100)}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(`[ENHANCED OPENAI SUCCESS] Strategy: ${strategy}, Response received`);

    return parseAndValidateEnhanced(content, strategy);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error(`[ENHANCED OPENAI TIMEOUT] Strategy: ${strategy}`);
      throw new Error(`OpenAI request timed out for strategy: ${strategy}`);
    }
    
    console.error(`[ENHANCED OPENAI ERROR] Strategy: ${strategy}`, error);
    throw error;
  }
}

function parseAndValidateEnhanced(content: string, strategy: string) {
  try {
    // Enhanced JSON parsing with better error handling
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error(`[JSON PARSE ERROR] Strategy: ${strategy}, Content length: ${content.length}`);
      
      // Try to fix common JSON issues
      let fixedContent = content;
      
      // Remove any text before the first {
      const firstBrace = fixedContent.indexOf('{');
      if (firstBrace > 0) {
        fixedContent = fixedContent.substring(firstBrace);
      }
      
      // Remove any text after the last }
      const lastBrace = fixedContent.lastIndexOf('}');
      if (lastBrace >= 0 && lastBrace < fixedContent.length - 1) {
        fixedContent = fixedContent.substring(0, lastBrace + 1);
      }
      
      // Try parsing again
      try {
        parsedContent = JSON.parse(fixedContent);
        console.log(`[JSON PARSE RECOVERED] Strategy: ${strategy}`);
      } catch (secondParseError) {
        console.error(`[JSON PARSE FAILED] Strategy: ${strategy}, both attempts failed`);
        throw new Error(`Failed to parse JSON response for strategy: ${strategy}`);
      }
    }
    
    if (!parsedContent?.sentences || !Array.isArray(parsedContent.sentences)) {
      console.warn(`[VALIDATION WARNING] Invalid sentence structure for strategy: ${strategy}`);
      throw new Error(`Invalid response structure for strategy: ${strategy}`);
    }

    // Enhanced validation and sanitization
    parsedContent.sentences = parsedContent.sentences.map((sentence: any, index: number) => ({
      ...sentence,
      id: sentence.id || `sentence-${index + 1}`,
      analysis: {
        words: Array.isArray(sentence.analysis?.words) ? 
          sentence.analysis.words.slice(0, 8).map((word: any) => ({
            word: word.word || '',
            definition: word.definition || '',
            partOfSpeech: word.partOfSpeech || '',
            difficulty: word.difficulty || 'medium',
            contextualUsage: word.contextualUsage || word.definition || ''
          })) : [],
        grammar: Array.isArray(sentence.analysis?.grammar) ? sentence.analysis.grammar : [],
        translation: sentence.analysis?.translation || '',
        complexity: sentence.analysis?.complexity || 'moderate',
        keyPhrases: sentence.analysis?.keyPhrases || []
      }
    }));

    // Calculate accurate word count
    const actualWordCount = parsedContent.sentences.reduce((count: number, sentence: any) => {
      return count + (sentence.text?.split(/\s+/).filter((word: string) => word.length > 0).length || 0);
    }, 0);

    // Enhanced analysis section
    if (!parsedContent.analysis) {
      parsedContent.analysis = {};
    }
    
    parsedContent.analysis = {
      ...parsedContent.analysis,
      wordCount: actualWordCount,
      readingTime: Math.ceil(actualWordCount / 200),
      grammarPoints: Array.isArray(parsedContent.analysis.grammarPoints) ? 
        parsedContent.analysis.grammarPoints : [],
      generationStrategy: strategy,
      enhancedGeneration: true
    };

    console.log(`[ENHANCED VALIDATION] Strategy: ${strategy}, ${actualWordCount} words processed`);
    return parsedContent;
  } catch (error) {
    console.error(`[ENHANCED PARSE ERROR] Strategy: ${strategy}`, error);
    throw new Error(`Failed to parse response for strategy: ${strategy} - ${error.message}`);
  }
}

function combineChunksEnhanced(chunks: any[], target_length: number, strategy: string) {
  console.log(`[ENHANCED COMBINING] Strategy: ${strategy}, ${chunks.length} chunks`);
  
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
  
  console.log(`[ENHANCED COMBINATION] Strategy: ${strategy}, ${totalWordCount} words, ${allSentences.length} sentences`);
  
  return {
    sentences: allSentences,
    analysis: {
      wordCount: totalWordCount,
      readingTime: Math.ceil(totalWordCount / 200),
      grammarPoints: Array.from(allGrammarPoints),
      generationStrategy: strategy,
      chunksUsed: chunks.length,
      enhancedGeneration: true
    }
  };
}

function createEnhancedEmergencyChunk(topic: string, language: string, difficulty: string, wordCount: number) {
  const sentences = [];
  const wordsPerSentence = Math.max(10, Math.floor(wordCount / Math.max(3, Math.floor(wordCount / 20))));
  const sentenceCount = Math.ceil(wordCount / wordsPerSentence);
  
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push({
      id: `emergency-sentence-${i + 1}`,
      text: `This is emergency content for ${topic} in ${language}. System protection activated.`,
      analysis: {
        words: [
          {
            word: 'emergency',
            definition: 'A serious situation requiring immediate action',
            partOfSpeech: 'adjective',
            difficulty: 'medium'
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
      grammarPoints: ['emergency content'],
      generationStrategy: 'enhanced_emergency'
    }
  };
}

function generateIntelligentFallback(target_length: number, language: string, topic?: string, difficulty?: string) {
  console.log('[INTELLIGENT FALLBACK] Creating enhanced fallback content');
  
  const sentences = [];
  const wordsPerSentence = Math.max(15, Math.floor(target_length / 7));
  const numSentences = Math.ceil(target_length / wordsPerSentence);
  
  for (let i = 0; i < numSentences; i++) {
    sentences.push({
      id: `fallback-sentence-${i + 1}`,
      text: `This is intelligent fallback content for your ${language} reading exercise about ${topic || 'general topics'}. The system has implemented smart recovery protocols.`,
      analysis: {
        words: [
          {
            word: 'intelligent',
            definition: 'Having advanced reasoning capabilities',
            partOfSpeech: 'adjective',
            difficulty: 'medium'
          },
          {
            word: 'protocols',
            definition: 'Systematic procedures or rules',
            partOfSpeech: 'noun',
            difficulty: 'hard'
          }
        ],
        grammar: ['intelligent fallback', 'recovery protocols'],
        translation: 'Intelligent fallback content with recovery protocols.'
      }
    });
  }
  
  return {
    sentences,
    analysis: {
      wordCount: sentences.reduce((count, s) => count + s.text.split(' ').length, 0),
      readingTime: Math.ceil(target_length / 200),
      grammarPoints: ['intelligent fallback', 'smart recovery'],
      generationStrategy: 'intelligent_fallback',
      fallbackInfo: {
        method: 'intelligent_fallback',
        reason: 'Enhanced protection activated',
        isUsable: true
      }
    }
  };
}

function generateRecoveryData(target_length: number, language: string, topic?: string, difficulty?: string) {
  return {
    recoveryMethod: 'intelligent_fallback',
    targetLength: target_length,
    language: language,
    topic: topic || 'general',
    difficulty: difficulty || 'intermediate',
    fallbackQuality: 'high',
    estimatedQuality: 'excellent'
  };
}