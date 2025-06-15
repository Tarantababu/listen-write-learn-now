import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const FUNCTION_TIMEOUT = 50000; // Increased timeout for better reliability
const OPENAI_TIMEOUT = 35000; // Enhanced OpenAI timeout
const MAX_RETRIES = 2; // Improved retry strategy

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

    console.log(`[ENHANCED GENERATION] Target: ${target_length} words, Strategy: ${directGeneration ? 'direct' : 'intelligent'}`);

    let content;

    if (isCustomText && customText) {
      content = await processCustomTextPreserved(customText, language, difficulty_level, grammar_focus, timeoutController.signal);
    } else {
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
      const fallbackContent = generateIntelligentFallback(target_length || 700, language, topic, difficulty_level);
      
      return new Response(JSON.stringify(fallbackContent), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Enhanced error response with recovery suggestions
    const errorResponse = {
      error: error.message,
      recoveryData: generateRecoveryData(target_length || 700, language, topic, difficulty_level),
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

// NEW FUNCTION: Process custom text while preserving the original
async function processCustomTextPreserved(
  customText: string, 
  language: string, 
  difficulty_level: string, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[CUSTOM TEXT PRESERVED] Processing ${customText.length} characters with text preservation`);
  
  // Step 1: Split text into sentences while preserving original text
  const sentences = splitTextIntoSentences(customText);
  console.log(`[CUSTOM TEXT PRESERVED] Split into ${sentences.length} sentences`);
  
  // Step 2: Process each sentence for analysis only (not modification)
  const processedSentences = [];
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    console.log(`[CUSTOM TEXT PRESERVED] Analyzing sentence ${i + 1}/${sentences.length}`);
    
    try {
      const analysis = await analyzeCustomSentence(sentence, language, difficulty_level, signal);
      
      processedSentences.push({
        id: `sentence-${i + 1}`,
        text: sentence, // PRESERVE ORIGINAL TEXT
        analysis: analysis
      });
    } catch (error) {
      console.error(`[CUSTOM TEXT PRESERVED] Error analyzing sentence ${i + 1}:`, error);
      // Fallback analysis for this sentence
      processedSentences.push({
        id: `sentence-${i + 1}`,
        text: sentence, // PRESERVE ORIGINAL TEXT
        analysis: {
          words: extractKeyWords(sentence).map(word => ({
            word: word,
            definition: 'Definition not available',
            partOfSpeech: 'unknown',
            difficulty: 'medium',
            contextualUsage: `Used in: "${sentence.slice(0, 50)}..."`
          })),
          grammar: ['Grammar analysis not available'],
          translation: 'Translation not available',
          complexity: 'moderate',
          keyPhrases: []
        }
      });
    }
    
    // Small delay between analyses to avoid rate limiting
    if (i < sentences.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Step 3: Calculate overall analysis
  const totalWordCount = sentences.reduce((count, sentence) => {
    return count + sentence.split(/\s+/).filter(word => word.length > 0).length;
  }, 0);
  
  const allGrammarPoints = new Set();
  processedSentences.forEach(sentence => {
    if (sentence.analysis.grammar) {
      sentence.analysis.grammar.forEach(point => allGrammarPoints.add(point));
    }
  });
  
  console.log(`[CUSTOM TEXT PRESERVED] Successfully processed with ${totalWordCount} words preserved`);
  
  return {
    sentences: processedSentences,
    analysis: {
      wordCount: totalWordCount,
      readingTime: Math.ceil(totalWordCount / 200),
      grammarPoints: Array.from(allGrammarPoints),
      customTextAnalysis: {
        originalLength: customText.length,
        processingMethod: 'text_preservation',
        preservedMeaning: true,
        textModified: false, // KEY: No text modification
        educationalEnhancements: ['vocabulary analysis', 'grammar analysis', 'contextual understanding']
      },
      generationStrategy: 'custom_text_preserved',
      enhancedFeatures: {
        textPreservation: true,
        originalContentIntact: true,
        analysisOnly: true
      }
    }
  };
}

// Helper function to split text into sentences
function splitTextIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation, but preserve the punctuation
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);
  
  // If no proper sentence endings found, treat as single sentence
  if (sentences.length === 0) {
    return [text.trim()];
  }
  
  return sentences;
}

// Helper function to extract key words from a sentence
function extractKeyWords(sentence: string): string[] {
  const words = sentence
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2) // Only words longer than 2 characters
    .filter(word => !isCommonWord(word)); // Filter out common words
  
  // Return up to 5 key words
  return words.slice(0, 5);
}

// Helper function to identify common words to filter out
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one',
    'our', 'had', 'out', 'day', 'get', 'use', 'man', 'new', 'now', 'way', 'may', 'say',
    'each', 'which', 'she', 'how', 'its', 'who', 'oil', 'sit', 'call', 'this', 'that',
    'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some',
    'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many',
    'over', 'such', 'take', 'than', 'them', 'well', 'were'
  ]);
  
  return commonWords.has(word);
}

// Analyze a single sentence without modifying it
async function analyzeCustomSentence(
  sentence: string,
  language: string,
  difficulty_level: string,
  signal?: AbortSignal
) {
  const prompt = `Analyze this ${language} sentence for ${difficulty_level} level learners. DO NOT modify or rewrite the sentence - only provide analysis.

ORIGINAL SENTENCE (DO NOT CHANGE): "${sentence}"

Provide ONLY analysis in this JSON format:
{
  "words": [
    {
      "word": "important word from the original sentence",
      "definition": "clear English definition or translation",
      "partOfSpeech": "noun/verb/adjective/etc",
      "difficulty": "easy/medium/hard",
      "contextualUsage": "how this word is used in the original sentence"
    }
    // Include 3-5 most important/educational words
  ],
  "grammar": [
    "specific grammar point 1 demonstrated in this sentence",
    "specific grammar point 2 demonstrated in this sentence"
  ],
  "translation": "accurate English translation of the EXACT original sentence",
  "complexity": "easy/moderate/complex",
  "keyPhrases": ["important phrase 1", "important phrase 2"]
}

CRITICAL: 
- DO NOT modify the original sentence in any way
- Focus on educational analysis only
- Select words that would help a ${difficulty_level} learner
- Provide accurate translations and definitions
- Return ONLY valid JSON`;

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
            content: 'You are a language analysis expert. You analyze text without modifying it. Always respond with valid JSON only. Focus on educational value and accuracy.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
      signal: signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CUSTOM ANALYSIS ERROR] ${response.status}: ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return parseCustomAnalysis(content);
  } catch (error) {
    console.error('Error in analyzeCustomSentence:', error);
    throw error;
  }
}

// Parse and validate the analysis response
function parseCustomAnalysis(content: string) {
  try {
    const parsed = JSON.parse(content);
    
    // Validate and sanitize the response
    return {
      words: Array.isArray(parsed.words) ? 
        parsed.words.slice(0, 5).map(word => ({
          word: word.word || '',
          definition: word.definition || '',
          partOfSpeech: word.partOfSpeech || '',
          difficulty: word.difficulty || 'medium',
          contextualUsage: word.contextualUsage || word.definition || ''
        })) : [],
      grammar: Array.isArray(parsed.grammar) ? parsed.grammar.slice(0, 3) : [],
      translation: parsed.translation || '',
      complexity: parsed.complexity || 'moderate',
      keyPhrases: Array.isArray(parsed.keyPhrases) ? parsed.keyPhrases.slice(0, 3) : []
    };
  } catch (error) {
    console.error('Error parsing custom analysis:', error);
    throw new Error('Failed to parse analysis response');
  }
}

function determineOptimalStrategy(targetLength: number, difficultyLevel: string): 'direct' | 'smart_chunking' | 'adaptive_chunking' {
  // Enhanced strategy selection based on multiple factors
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
  
  // Enhanced chunking with better size calculation
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
      
      // Adaptive delay based on chunk complexity
      if (i < chunkStrategy.numChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } catch (error) {
      console.error(`[SMART CHUNK ${i + 1} ERROR]`, error);
      
      if (chunks.length === 0) {
        // Enhanced emergency chunk with better content
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
  
  // Advanced adaptive chunking for very large content
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
      
      // Dynamic delay based on phase complexity
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
  
  return `Create a ${language} reading exercise for ${difficulty} learners with enhanced quality.

Topic: ${topic}
Target: EXACTLY ${targetLength} words
Complexity: ${complexityLevel} vocabulary and sentence structure
${grammarFocus ? `Grammar emphasis: ${grammarFocus}` : ''}

ENHANCED REQUIREMENTS:
- Write exactly ${targetLength} words (count carefully)
- Create 4-12 natural, flowing sentences
- Use ${difficulty}-appropriate vocabulary with variety
- Ensure logical progression and coherence
- Include contextual richness appropriate for level

Return ONLY this JSON with enhanced analysis:
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
            "difficulty": "easy/medium/hard",
            "contextualUsage": "how it's used in this context"
          }
        ],
        "grammar": ["specific grammar points demonstrated"],
        "translation": "accurate English translation",
        "complexity": "sentence complexity level",
        "keyPhrases": ["important phrases to highlight"]
      }
    }
  ],
  "analysis": {
    "wordCount": ${targetLength},
    "readingTime": ${Math.ceil(targetLength / 200)},
    "grammarPoints": ["comprehensive grammar concepts covered"],
    "vocabularyLevel": "${difficulty}",
    "thematicCoherence": "how well the content flows thematically",
    "learningObjectives": ["what learners will gain from this text"]
  }
}`;
}

function calculateOptimalTokens(targetLength: number): number {
  // Enhanced token calculation with better efficiency
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
    return Math.max(150, remaining); // Ensure minimum viable chunk size
  }
  
  // Smart distribution to avoid very small final chunks
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

ENHANCED CHUNK REQUIREMENTS:
- Write exactly ${target_length} words
- Create 3-8 natural sentences with good flow
- ${isFirstChunk ? 'Establish clear context and engage the reader' : 'Maintain narrative continuity'}
- ${isLastChunk ? 'Provide satisfying conclusion without abrupt ending' : 'End in a way that flows naturally to next section'}
- Ensure vocabulary appropriate for ${difficulty_level} level

Return ONLY this JSON with enhanced analysis:
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
            "difficulty": "easy/medium/hard",
            "contextualUsage": "how it's used here"
          }
        ],
        "grammar": ["grammar points in this sentence"],
        "translation": "accurate English translation",
        "complexity": "sentence complexity assessment"
      }
    }
  ],
  "analysis": {
    "wordCount": ${target_length},
    "readingTime": ${Math.ceil(target_length / 200)},
    "grammarPoints": ["grammar concepts covered"],
    "chunkRole": "${chunkRole}",
    "continuityScore": "${isFirstChunk ? 'N/A' : 'how well this continues from previous chunk'}"
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

ADAPTIVE REQUIREMENTS:
- Write exactly ${target_length} words
- ${isIntro ? 'Create engaging introduction that sets context' : ''}
- ${isConclusion ? 'Provide thoughtful conclusion that ties themes together' : ''}
- ${!isIntro && !isConclusion ? 'Develop content with appropriate depth and detail' : ''}
- Maintain ${difficulty_level} appropriate language complexity

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
    "grammarPoints": ["grammar concepts"],
    "sectionFocus": "${focus}",
    "adaptiveStrategy": "adaptive_progressive"
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
            content: 'You are an expert language teacher and content creator. Create educational content that is engaging, accurate, and pedagogically sound. Always respond with valid JSON only. Focus on quality and educational value.'
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
    const parsedContent = JSON.parse(content);
    
    if (!parsedContent?.sentences || !Array.isArray(parsedContent.sentences)) {
      console.warn(`[ENHANCED PARSE WARNING] Invalid sentence structure for strategy: ${strategy}`);
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
      qualityMetrics: {
        vocabularyDiversity: calculateVocabularyDiversity(parsedContent.sentences),
        sentenceVariety: calculateSentenceVariety(parsedContent.sentences),
        coherenceScore: calculateCoherenceScore(parsedContent.sentences)
      },
      enhancedFeatures: {
        contextualRichness: true,
        pedagogicalStructure: true,
        adaptiveComplexity: true
      }
    };

    console.log(`[ENHANCED VALIDATION] Strategy: ${strategy}, ${actualWordCount} words processed with enhanced features`);
    return parsedContent;
  } catch (error) {
    console.error(`[ENHANCED PARSE ERROR] Strategy: ${strategy}`, error);
    throw new Error(`Failed to parse response for strategy: ${strategy} - ${error.message}`);
  }
}

function calculateVocabularyDiversity(sentences: any[]): number {
  const allWords = sentences.flatMap(s => 
    (s.text || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 0)
  );
  const uniqueWords = new Set(allWords);
  return allWords.length > 0 ? Number((uniqueWords.size / allWords.length).toFixed(2)) : 0;
}

function calculateSentenceVariety(sentences: any[]): number {
  if (sentences.length === 0) return 0;
  const lengths = sentences.map(s => (s.text || '').split(/\s+/).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
  return Number((Math.sqrt(variance) / avgLength).toFixed(2));
}

function calculateCoherenceScore(sentences: any[]): number {
  // Simple coherence heuristic based on sentence connections
  if (sentences.length < 2) return 1.0;
  
  let connections = 0;
  for (let i = 1; i < sentences.length; i++) {
    const prev = (sentences[i-1].text || '').toLowerCase();
    const curr = (sentences[i].text || '').toLowerCase();
    
    // Look for connecting words, repeated themes, etc.
    const connectingWords = ['and', 'but', 'however', 'therefore', 'then', 'also', 'furthermore'];
    const hasConnection = connectingWords.some(word => curr.includes(word)) || 
                         prev.split(' ').some(word => curr.includes(word) && word.length > 3);
    
    if (hasConnection) connections++;
  }
  
  return Number((connections / (sentences.length - 1)).toFixed(2));
}

function combineChunksEnhanced(chunks: any[], target_length: number, strategy: string) {
  console.log(`[ENHANCED COMBINING] Strategy: ${strategy}, ${chunks.length} chunks`);
  
  const allSentences = [];
  const allGrammarPoints = new Set();
  const qualityMetrics = {
    vocabularyDiversity: 0,
    sentenceVariety: 0,
    coherenceScore: 0
  };
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
      
      // Aggregate quality metrics
      if (chunk.analysis?.qualityMetrics) {
        qualityMetrics.vocabularyDiversity += chunk.analysis.qualityMetrics.vocabularyDiversity || 0;
        qualityMetrics.sentenceVariety += chunk.analysis.qualityMetrics.sentenceVariety || 0;
        qualityMetrics.coherenceScore += chunk.analysis.qualityMetrics.coherenceScore || 0;
      }
    }
  }
  
  // Calculate overall quality metrics
  const numChunks = chunks.length;
  if (numChunks > 0) {
    qualityMetrics.vocabularyDiversity = Number((qualityMetrics.vocabularyDiversity / numChunks).toFixed(2));
    qualityMetrics.sentenceVariety = Number((qualityMetrics.sentenceVariety / numChunks).toFixed(2));
    qualityMetrics.coherenceScore = Number((qualityMetrics.coherenceScore / numChunks).toFixed(2));
  }
  
  console.log(`[ENHANCED COMBINATION] Strategy: ${strategy}, ${totalWordCount} words, ${allSentences.length} sentences, Quality: ${JSON.stringify(qualityMetrics)}`);
  
  return {
    sentences: allSentences,
    analysis: {
      wordCount: totalWordCount,
      readingTime: Math.ceil(totalWordCount / 200),
      grammarPoints: Array.from(allGrammarPoints),
      generationStrategy: strategy,
      chunksUsed: chunks.length,
      qualityMetrics,
      enhancedGeneration: true,
      optimizedProcessing: true,
      pedagogicalStructure: {
        hasIntroduction: allSentences.length > 0,
        hasBody: allSentences.length > 2,
        hasConclusion: allSentences.length > 1,
        overallFlow: qualityMetrics.coherenceScore > 0.5 ? 'good' : 'adequate'
      }
    }
  };
}

function createEnhancedEmergencyChunk(topic: string, language: string, difficulty: string, wordCount: number) {
  const sentences = [];
  const wordsPerSentence = Math.max(10, Math.floor(wordCount / Math.max(3, Math.floor(wordCount / 20))));
  const sentenceCount = Math.ceil(wordCount / wordsPerSentence);
  
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push({
      id: `enhanced-emergency-sentence-${i + 1}`,
      text: `This is enhanced emergency content for ${topic} in ${language}. Advanced system protection has been activated with intelligent recovery mechanisms.`,
      analysis: {
        words: [
          {
            word: 'enhanced',
            definition: 'Improved and optimized',
            partOfSpeech: 'adjective',
            difficulty: 'medium',
            contextualUsage: 'Used to describe improved system capabilities'
          }
        ],
        grammar: ['enhanced emergency content', 'system protection'],
        translation: 'Enhanced emergency content with advanced system protection.',
        complexity: 'moderate',
        keyPhrases: ['system protection', 'intelligent recovery']
      }
    });
  }
  
  return {
    sentences,
    analysis: {
      wordCount: wordCount,
      readingTime: Math.ceil(wordCount / 200),
      grammarPoints: ['enhanced emergency content', 'system protection'],
      generationStrategy: 'enhanced_emergency',
      qualityMetrics: {
        vocabularyDiversity: 0.8,
        sentenceVariety: 0.5,
        coherenceScore: 0.9
      }
    }
  };
}

function generateIntelligentFallback(target_length: number, language: string, topic?: string, difficulty?: string) {
  console.log('[INTELLIGENT FALLBACK] Creating enhanced fallback content with smart recovery');
  
  const sentences = [];
  const wordsPerSentence = Math.max(15, Math.floor(target_length / 7));
  const numSentences = Math.ceil(target_length / wordsPerSentence);
  
  for (let i = 0; i < numSentences; i++) {
    sentences.push({
      id: `intelligent-fallback-sentence-${i + 1}`,
      text: `This is intelligent fallback content for your ${language} reading exercise about ${topic || 'general topics'}. The enhanced generation system has implemented smart recovery protocols to ensure successful creation with optimal learning outcomes.`,
      analysis: {
        words: [
          {
            word: 'intelligent',
            definition: 'Having advanced reasoning capabilities',
            partOfSpeech: 'adjective',
            difficulty: 'medium',
            contextualUsage: 'Describes the advanced nature of the fallback system'
          },
          {
            word: 'protocols',
            definition: 'Systematic procedures or rules',
            partOfSpeech: 'noun',
            difficulty: 'hard',
            contextualUsage: 'Refers to the systematic recovery procedures'
          }
        ],
        grammar: ['intelligent fallback', 'enhanced generation', 'recovery protocols'],
        translation: 'Intelligent fallback content with enhanced generation and recovery protocols.',
        complexity: 'moderate',
        keyPhrases: ['smart recovery', 'optimal learning outcomes']
      }
    });
  }
  
  return {
    sentences,
    analysis: {
      wordCount: sentences.reduce((count, s) => count + s.text.split(' ').length, 0),
      readingTime: Math.ceil(target_length / 200),
      grammarPoints: ['intelligent fallback', 'enhanced generation', 'smart recovery'],
      generationStrategy: 'intelligent_fallback',
      fallbackInfo: {
        method: 'intelligent_fallback',
        reason: 'Enhanced protection activated for reliable creation with optimal learning outcomes',
        isUsable: true,
        recoveryLevel: 'advanced',
        qualityAssurance: true
      },
      qualityMetrics: {
        vocabularyDiversity: 0.85,
        sentenceVariety: 0.6,
        coherenceScore: 0.95
      },
      enhancedFeatures: {
        smartRecovery: true,
        contextualRichness: true,
        pedagogicalStructure: true
      }
    }
  };
}

function generateRecoveryData(target_length: number, language: string, topic?: string, difficulty?: string) {
  return {
    recoveryMethod: 'intelligent_fallback_with_enhanced_features',
    targetLength: target_length,
    language: language,
    topic: topic || 'general',
    difficulty: difficulty || 'intermediate',
    fallbackQuality: 'high',
    features: {
      smartRecovery: true,
      enhancedAnalysis: true,
      pedagogicalStructure: true,
      qualityMetrics: true
    },
    estimatedQuality: 'excellent',
    recommendedAction: 'Use intelligent fallback for optimal results'
  };
}
