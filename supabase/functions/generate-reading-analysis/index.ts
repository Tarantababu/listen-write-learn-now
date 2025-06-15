import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

interface RequestBody {
  text: string
  language: string
  type?: string
  supportLanguage?: string
  chunkIndex?: number
}

interface AnalysisWord {
  word: string
  definition: string
  exampleSentence: string
}

interface SentenceAnalysis {
  text: string
  analysis: {
    words: AnalysisWord[]
    grammarInsights: string[]
    structure: string
  }
}

interface AnalysisContent {
  sentences: SentenceAnalysis[]
  commonPatterns: string[]
  summary: string
  englishTranslation: string
}

interface WordTranslation {
  original: string
  translation: string
}

interface BidirectionalTranslation {
  normalTranslation: string
  literalTranslation: string
  wordTranslations: WordTranslation[]
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const MAX_TOKENS_OPTIMIZED = 1000
const MAX_TOKENS_FALLBACK = 600

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, language, type, supportLanguage, chunkIndex } = await req.json() as RequestBody

    if (!text || !language) {
      return new Response(
        JSON.stringify({ error: 'Text and language are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`Generating ${type || 'reading analysis'} for "${text.substring(0, 20)}..." in ${language}`)

    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    // Handle optimized bidirectional translation request
    if (type === 'optimized_bidirectional_translation') {
      const translation = await generateOptimizedBidirectionalTranslationWithRetry(
        text, 
        language, 
        supportLanguage || 'english', 
        openAIApiKey,
        chunkIndex
      )
      return new Response(
        JSON.stringify(translation),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Handle bidirectional translation request
    if (type === 'bidirectional_translation') {
      const translation = await generateBidirectionalTranslationWithRetry(text, language, supportLanguage || 'english', openAIApiKey)
      return new Response(
        JSON.stringify(translation),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Split the text into sentences for regular analysis
    const rawSentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
    
    // Process analysis using OpenAI
    const analysis = await generateFullAnalysis(text, rawSentences, language, openAIApiKey)
    
    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function generateOptimizedBidirectionalTranslationWithRetry(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string,
  chunkIndex?: number
): Promise<BidirectionalTranslation> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[OPTIMIZED TRANSLATION] Attempt ${attempt}/${MAX_RETRIES} for chunk ${chunkIndex ?? 'unknown'}`)
      
      const result = await generateOptimizedBidirectionalTranslation(
        text,
        sourceLanguage,
        targetLanguage,
        apiKey,
        chunkIndex,
        attempt > 1 // Use fallback mode after first attempt
      )
      
      console.log(`[OPTIMIZED TRANSLATION] Success on attempt ${attempt}`)
      return result
    } catch (error) {
      lastError = error as Error
      console.error(`[OPTIMIZED TRANSLATION] Attempt ${attempt} failed:`, error)
      
      if (attempt < MAX_RETRIES) {
        console.log(`[OPTIMIZED TRANSLATION] Retrying in ${RETRY_DELAY}ms...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
      }
    }
  }

  console.error(`[OPTIMIZED TRANSLATION] All ${MAX_RETRIES} attempts failed, using fallback`)
  return createFallbackTranslation(text, sourceLanguage, targetLanguage, chunkIndex)
}

async function generateOptimizedBidirectionalTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string,
  chunkIndex?: number,
  useFallbackMode: boolean = false
): Promise<BidirectionalTranslation> {
  const maxTokens = useFallbackMode ? MAX_TOKENS_FALLBACK : MAX_TOKENS_OPTIMIZED
  const wordLimit = useFallbackMode ? 15 : 25
  
  const prompt = `
Translate this ${sourceLanguage} text segment into ${targetLanguage}. ${chunkIndex !== undefined ? `This is segment ${chunkIndex + 1}.` : ''}

TEXT: "${text}"

Provide ONLY a JSON response with these exact fields:
{
  "normalTranslation": "Natural, fluent translation in ${targetLanguage}",
  "literalTranslation": "Word-order preserving translation showing structure",
  "wordTranslations": [
    {"original": "word1", "translation": "translation1"},
    {"original": "word2", "translation": "translation2"}
  ]
}

IMPORTANT:
- normalTranslation: Make it sound natural to native ${targetLanguage} speakers
- literalTranslation: Keep original word order as much as possible to show structure
- wordTranslations: Include up to ${wordLimit} significant content words (nouns, verbs, adjectives), skip articles/prepositions unless crucial
- Return ONLY valid JSON, no explanations or additional text
- Ensure JSON is properly closed with all brackets and braces
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert translator. Respond only with valid JSON. ${useFallbackMode ? 'Keep responses concise.' : 'Focus on accuracy and completeness.'}` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: maxTokens
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    console.log(`[OPTIMIZED TRANSLATION] Raw response length: ${content.length}`)
    
    // Enhanced JSON parsing with cleanup
    const cleanedContent = cleanJsonResponse(content)
    
    try {
      const parsed = JSON.parse(cleanedContent)
      
      // Validate required fields
      if (!parsed.normalTranslation || !parsed.literalTranslation || !Array.isArray(parsed.wordTranslations)) {
        throw new Error('Missing required fields in response')
      }
      
      return {
        normalTranslation: parsed.normalTranslation,
        literalTranslation: parsed.literalTranslation,
        wordTranslations: parsed.wordTranslations.slice(0, wordLimit) // Limit word translations
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.log('Cleaned content:', cleanedContent)
      throw new Error(`Failed to parse JSON response: ${parseError.message}`)
    }
  } catch (error) {
    console.error('Error in generateOptimizedBidirectionalTranslation:', error)
    throw error
  }
}

function cleanJsonResponse(content: string): string {
  // Remove any text before the first {
  let cleaned = content.substring(content.indexOf('{'))
  
  // Find the last complete } that closes the JSON
  let braceCount = 0
  let lastValidIndex = -1
  
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{') {
      braceCount++
    } else if (cleaned[i] === '}') {
      braceCount--
      if (braceCount === 0) {
        lastValidIndex = i
        break
      }
    }
  }
  
  if (lastValidIndex > -1) {
    cleaned = cleaned.substring(0, lastValidIndex + 1)
  }
  
  // Remove any trailing text after the JSON
  return cleaned.trim()
}

function createFallbackTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  chunkIndex?: number
): BidirectionalTranslation {
  console.log(`[FALLBACK TRANSLATION] Creating fallback for chunk ${chunkIndex ?? 'unknown'}`)
  
  return {
    normalTranslation: `Translation unavailable for this ${sourceLanguage} text segment. The content could not be processed due to technical limitations.`,
    literalTranslation: `Literal translation unavailable for this ${sourceLanguage} text segment.`,
    wordTranslations: []
  }
}

async function generateBidirectionalTranslationWithRetry(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string
): Promise<BidirectionalTranslation> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await generateBidirectionalTranslation(text, sourceLanguage, targetLanguage, apiKey)
      return result
    } catch (error) {
      lastError = error as Error
      console.error(`[BIDIRECTIONAL TRANSLATION] Attempt ${attempt} failed:`, error)
      
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
      }
    }
  }

  return createFallbackTranslation(text, sourceLanguage, targetLanguage)
}

async function generateBidirectionalTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string
): Promise<BidirectionalTranslation> {
  const prompt = `
Translate this ${sourceLanguage} sentence into ${targetLanguage} in two different ways and provide word-by-word translations:

1. Normal Translation: A natural, fluent translation that sounds native in ${targetLanguage}
2. Literal Translation: A word-by-word translation that maintains the original sentence structure as much as possible
3. Word Translations: Individual word translations in the same order as the original sentence

Sentence: "${text}"

IMPORTANT: For word translations, provide each word from the original sentence with its most direct translation, even if some words don't have direct equivalents (use closest meaning or indicate with parentheses like "(no direct equivalent)").

Return the response as a valid JSON object with these fields:
{
  "normalTranslation": "The natural, fluent translation",
  "literalTranslation": "The word-by-word translation",
  "wordTranslations": [
    {"original": "word1", "translation": "translation1"},
    {"original": "word2", "translation": "translation2"}
  ]
}
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional translator that provides accurate translations with word-by-word breakdowns. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 800
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    const cleanedContent = cleanJsonResponse(content)
    
    try {
      return JSON.parse(cleanedContent)
    } catch (e) {
      console.error('Failed to parse bidirectional translation response as JSON:', e)
      console.log('Raw response:', content)
      
      return {
        normalTranslation: "Translation could not be generated.",
        literalTranslation: "Literal translation could not be generated.",
        wordTranslations: []
      }
    }
  } catch (error) {
    console.error('Error generating bidirectional translation:', error)
    throw error
  }
}

async function generateFullAnalysis(
  fullText: string, 
  sentences: string[], 
  language: string,
  apiKey: string
): Promise<AnalysisContent> {
  // First, get translation and summary using OpenAI
  const generalAnalysis = await getGeneralAnalysis(fullText, language, apiKey)
  
  // Then process each sentence
  const sentenceAnalysisPromises = sentences.map(sentence => 
    analyzeSentence(sentence, language, apiKey)
  )
  
  // Process analysis for common patterns
  const commonPatternsPromise = getCommonPatterns(fullText, language, apiKey)
  
  // Wait for all promises to resolve
  const [sentenceAnalysisResults, commonPatterns] = await Promise.all([
    Promise.all(sentenceAnalysisPromises),
    commonPatternsPromise
  ])
  
  // Combine all results into the final analysis content
  return {
    sentences: sentences.map((sentence, i) => ({
      text: sentence,
      analysis: sentenceAnalysisResults[i]
    })),
    commonPatterns,
    summary: generalAnalysis.summary,
    englishTranslation: generalAnalysis.translation
  }
}

async function getGeneralAnalysis(
  text: string,
  language: string,
  apiKey: string
): Promise<{summary: string, translation: string}> {
  const prompt = `
Analyze this ${language} text and provide:
1. A concise summary (2-3 sentences) in English about the content
2. A clear translation into English (if the text is not in English)

Return the response as a valid JSON object with these fields:
{
  "summary": "The concise summary of the text in English",
  "translation": "The full translation of the text in English"
}

Text for analysis: "${text}"
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a language analysis assistant that provides accurate translations and summaries. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    try {
      // Parse the JSON response
      return JSON.parse(content)
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e)
      console.log('Raw response:', content)
      
      // Return a generic analysis if parsing fails
      return {
        summary: "Summary could not be generated.",
        translation: "Translation could not be generated."
      }
    }
  } catch (error) {
    console.error('Error generating general analysis:', error)
    throw error
  }
}

async function analyzeSentence(
  sentence: string, 
  language: string, 
  apiKey: string
): Promise<{words: AnalysisWord[], grammarInsights: string[], structure: string}> {
  const prompt = `
Analyze this ${language} sentence: "${sentence}"

Provide detailed analysis in this JSON format:
{
  "words": [
    {
      "word": "important word from the sentence",
      "definition": "clear English definition or translation with no quotes",
      "exampleSentence": "example in ${language} using this word"
    },
    // 3-5 most important words from the sentence
  ],
  "grammarInsights": [
    "grammar insight 1",
    "grammar insight 2",
    "grammar insight 3"
  ],
  "structure": "explanation of the sentence structure in one paragraph"
}

Notes:
- For "words", focus on 3-5 most important words that would help a language learner
- Ensure each word has a clear English definition/translation
- Provide 2-3 grammar insights specific to this sentence
- Return valid JSON only
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a language analysis assistant that provides structured sentence analysis. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    try {
      // Parse the JSON response
      return JSON.parse(content)
    } catch (e) {
      console.error('Failed to parse sentence analysis response as JSON:', e)
      console.log('Raw response:', content)
      
      // Return a generic analysis if parsing fails
      return {
        words: [{ 
          word: sentence.split(' ')[0], 
          definition: "Definition unavailable", 
          exampleSentence: sentence 
        }],
        grammarInsights: ["Grammar analysis unavailable"],
        structure: "Sentence structure analysis unavailable"
      }
    }
  } catch (error) {
    console.error('Error analyzing sentence:', error)
    throw error
  }
}

async function getCommonPatterns(
  text: string, 
  language: string, 
  apiKey: string
): Promise<string[]> {
  const prompt = `
Analyze this ${language} text and identify 3-4 common language patterns that would be useful for a beginner learner.
Return only a JSON array of strings with each pattern description.

Text: "${text.substring(0, 500)}${text.length > 500 ? '...' : ''}"
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a language analysis assistant that identifies common language patterns. Return only a JSON array of strings.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    try {
      // Parse the JSON response
      return JSON.parse(content)
    } catch (e) {
      console.error('Failed to parse common patterns response as JSON:', e)
      console.log('Raw response:', content)
      
      // Return generic patterns if parsing fails
      return ["Common patterns could not be identified."]
    }
  } catch (error) {
    console.error('Error generating common patterns:', error)
    throw error
  }
}
