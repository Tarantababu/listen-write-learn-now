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

// Enhanced token limits based on text length with more conservative word limits
const getTokenLimits = (textLength: number) => {
  if (textLength < 200) {
    return { maxTokens: 1000, wordLimit: 15 }
  } else if (textLength < 500) {
    return { maxTokens: 1400, wordLimit: 12 }
  } else if (textLength < 1000) {
    return { maxTokens: 1800, wordLimit: 10 }
  } else if (textLength < 1500) {
    return { maxTokens: 2200, wordLimit: 8 }
  } else {
    return { maxTokens: 2800, wordLimit: 6 }
  }
}

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

async function generateBidirectionalTranslationWithRetry(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string
): Promise<BidirectionalTranslation> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[BIDIRECTIONAL TRANSLATION] Attempt ${attempt}/${MAX_RETRIES} for text length: ${text.length}`)
      
      const result = await generateBidirectionalTranslation(
        text,
        sourceLanguage,
        targetLanguage,
        apiKey,
        attempt > 1 // Use fallback mode after first attempt
      )
      
      console.log(`[BIDIRECTIONAL TRANSLATION] Success on attempt ${attempt}`)
      return result
    } catch (error) {
      lastError = error as Error
      console.error(`[BIDIRECTIONAL TRANSLATION] Attempt ${attempt} failed:`, error)
      
      if (attempt < MAX_RETRIES) {
        console.log(`[BIDIRECTIONAL TRANSLATION] Retrying in ${RETRY_DELAY}ms...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
      }
    }
  }

  console.error(`[BIDIRECTIONAL TRANSLATION] All ${MAX_RETRIES} attempts failed, using fallback`)
  return createFallbackTranslation(text, sourceLanguage, targetLanguage)
}

async function generateBidirectionalTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string,
  useFallbackMode: boolean = false
): Promise<BidirectionalTranslation> {
  const textLength = text.length
  const { maxTokens, wordLimit } = getTokenLimits(textLength)
  
  console.log(`[BIDIRECTIONAL TRANSLATION] Text length: ${textLength}, Max tokens: ${maxTokens}, Word limit: ${wordLimit}, Fallback mode: ${useFallbackMode}`)

  // Optimized prompt focusing on content words and clear JSON structure
  const prompt = `
Translate this ${sourceLanguage} text to ${targetLanguage}.

TEXT: "${text}"

Provide ONLY a valid JSON object with these exact fields:

{
  "normalTranslation": "Natural fluent translation in ${targetLanguage}",
  "literalTranslation": "Word-order preserving translation showing original structure",
  "wordTranslations": [
    {"original": "word1", "translation": "meaning1"},
    {"original": "word2", "translation": "meaning2"}
  ]
}

CRITICAL REQUIREMENTS:
- normalTranslation: Natural, native-sounding ${targetLanguage}
- literalTranslation: Keep original word order to show sentence structure
- wordTranslations: Include ONLY ${wordLimit} most important content words (nouns, verbs, adjectives). Skip articles, prepositions, conjunctions
- Return ONLY valid JSON - no explanations, no markdown, no extra text
- Ensure JSON is complete and properly closed with all brackets
- If text is long, prioritize accuracy over completeness

JSON response:`

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
            content: `You are a professional translator. Respond ONLY with valid JSON. ${useFallbackMode ? 'Keep responses concise due to length constraints.' : 'Focus on accuracy.'}` 
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
    
    console.log(`[BIDIRECTIONAL TRANSLATION] Raw response length: ${content.length}`)
    console.log(`[BIDIRECTIONAL TRANSLATION] Response preview: ${content.substring(0, 200)}...`)
    
    // Enhanced JSON parsing with multiple cleanup strategies
    const cleanedContent = enhancedJsonCleanup(content)
    console.log(`[BIDIRECTIONAL TRANSLATION] Cleaned content length: ${cleanedContent.length}`)
    
    try {
      const parsed = JSON.parse(cleanedContent)
      
      // Validate required fields
      if (!parsed.normalTranslation || !parsed.literalTranslation) {
        throw new Error('Missing required translation fields in response')
      }
      
      // Ensure wordTranslations is an array and limit it
      if (!Array.isArray(parsed.wordTranslations)) {
        parsed.wordTranslations = []
      }
      
      const limitedWordTranslations = parsed.wordTranslations.slice(0, wordLimit)
      
      console.log(`[BIDIRECTIONAL TRANSLATION] Parsed successfully with ${limitedWordTranslations.length} word translations`)
      
      return {
        normalTranslation: parsed.normalTranslation,
        literalTranslation: parsed.literalTranslation,
        wordTranslations: limitedWordTranslations
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.log('Problematic content:', cleanedContent.substring(0, 500) + '...')
      
      // Try to extract partial data if possible
      const partialData = extractPartialTranslation(content, sourceLanguage, targetLanguage)
      if (partialData) {
        console.log('Using partial extraction fallback')
        return partialData
      }
      
      throw new Error(`Failed to parse JSON response: ${parseError.message}`)
    }
  } catch (error) {
    console.error('Error in generateBidirectionalTranslation:', error)
    throw error
  }
}

function enhancedJsonCleanup(content: string): string {
  console.log(`[JSON CLEANUP] Starting cleanup for content length: ${content.length}`)
  
  // Remove any markdown formatting
  let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
  
  // Find the first opening brace
  const startIndex = cleaned.indexOf('{')
  if (startIndex === -1) {
    throw new Error('No JSON object found in response')
  }
  
  cleaned = cleaned.substring(startIndex)
  
  // Enhanced brace matching to find the complete JSON object
  let braceCount = 0
  let lastValidIndex = -1
  let inString = false
  let escapeNext = false
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    
    if (escapeNext) {
      escapeNext = false
      continue
    }
    
    if (char === '\\') {
      escapeNext = true
      continue
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString
      continue
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++
      } else if (char === '}') {
        braceCount--
        if (braceCount === 0) {
          lastValidIndex = i
          break
        }
      }
    }
  }
  
  if (lastValidIndex > -1) {
    cleaned = cleaned.substring(0, lastValidIndex + 1)
    console.log(`[JSON CLEANUP] Found complete JSON object, length: ${cleaned.length}`)
  } else {
    // If we can't find a complete JSON, try to repair it
    console.log(`[JSON CLEANUP] No complete JSON found, attempting repair`)
    cleaned = attemptJsonRepair(cleaned)
  }
  
  return cleaned.trim()
}

function attemptJsonRepair(content: string): string {
  console.log(`[JSON REPAIR] Attempting to repair incomplete JSON`)
  
  // Find the last complete field
  const lastCompleteFieldPatterns = [
    /("literalTranslation":\s*"[^"]*(?:\\.[^"]*)*")/,
    /("normalTranslation":\s*"[^"]*(?:\\.[^"]*)*")/
  ]
  
  let truncated = content
  let foundPattern = false
  
  for (const pattern of lastCompleteFieldPatterns) {
    const match = content.match(pattern)
    if (match) {
      const endIndex = content.indexOf(match[0]) + match[0].length
      truncated = content.substring(0, endIndex)
      foundPattern = true
      console.log(`[JSON REPAIR] Found complete field, truncating at position: ${endIndex}`)
      break
    }
  }
  
  if (!foundPattern) {
    // Last resort: try to find any complete string value
    const lastQuoteIndex = content.lastIndexOf('"}')
    if (lastQuoteIndex > -1) {
      truncated = content.substring(0, lastQuoteIndex + 2)
      console.log(`[JSON REPAIR] Using last quote as truncation point`)
    }
  }
  
  // Ensure we have wordTranslations array (even if empty)
  if (!truncated.includes('"wordTranslations"')) {
    // Add empty wordTranslations array
    if (truncated.endsWith('"')) {
      truncated += ', "wordTranslations": []'
    } else if (truncated.endsWith('}')) {
      // Insert before closing brace
      truncated = truncated.slice(0, -1) + ', "wordTranslations": []}'
    } else {
      truncated += ', "wordTranslations": []'
    }
  } else if (truncated.includes('"wordTranslations": [') && !truncated.includes(']}')) {
    // Close incomplete array
    truncated += ']'
  }
  
  // Close the main object if needed
  if (!truncated.endsWith('}')) {
    truncated += '}'
  }
  
  console.log(`[JSON REPAIR] Repaired JSON length: ${truncated.length}`)
  return truncated
}

function extractPartialTranslation(
  content: string,
  sourceLanguage: string,
  targetLanguage: string
): BidirectionalTranslation | null {
  console.log(`[PARTIAL EXTRACTION] Attempting to extract partial translation data`)
  
  try {
    // Try to extract translations using more flexible regex patterns
    const normalMatch = content.match(/"normalTranslation":\s*"([^"]*(?:\\.[^"]*)*)"/s)
    const literalMatch = content.match(/"literalTranslation":\s*"([^"]*(?:\\.[^"]*)*)"/s)
    
    if (normalMatch || literalMatch) {
      console.log('Extracted partial translation data successfully')
      return {
        normalTranslation: normalMatch ? normalMatch[1].replace(/\\"/g, '"') : `Translation service encountered issues with this ${sourceLanguage} text.`,
        literalTranslation: literalMatch ? literalMatch[1].replace(/\\"/g, '"') : `Literal translation unavailable for this ${sourceLanguage} text.`,
        wordTranslations: [] // Empty array as fallback
      }
    }
  } catch (error) {
    console.error('Error extracting partial translation:', error)
  }
  
  return null
}

function createFallbackTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): BidirectionalTranslation {
  console.log(`[FALLBACK TRANSLATION] Creating fallback for ${sourceLanguage} to ${targetLanguage}`)
  
  return {
    normalTranslation: `Translation service temporarily unavailable for this ${sourceLanguage} text. The content appears to discuss various topics and may require manual translation for best results.`,
    literalTranslation: `Word-by-word translation unavailable for this ${sourceLanguage} text segment.`,
    wordTranslations: []
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
