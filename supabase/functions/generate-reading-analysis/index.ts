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
      const translation = await generateOptimizedBidirectionalTranslation(
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
      const translation = await generateBidirectionalTranslation(text, language, supportLanguage || 'english', openAIApiKey)
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

async function generateOptimizedBidirectionalTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string,
  chunkIndex?: number
): Promise<BidirectionalTranslation> {
  const prompt = `
Translate this ${sourceLanguage} text segment into ${targetLanguage}. This is ${chunkIndex !== undefined ? `segment ${chunkIndex + 1}` : 'a text segment'}.

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
- wordTranslations: Include significant content words (nouns, verbs, adjectives), skip articles/prepositions unless crucial
- Return ONLY valid JSON, no explanations
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
            content: 'You are an expert translator. Respond only with valid JSON. Focus on accuracy and efficiency.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
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
      return JSON.parse(content)
    } catch (e) {
      console.error('Failed to parse optimized translation response as JSON:', e)
      console.log('Raw response:', content)
      
      return {
        normalTranslation: "Translation could not be generated for this segment.",
        literalTranslation: "Literal translation could not be generated for this segment.",
        wordTranslations: []
      }
    }
  } catch (error) {
    console.error('Error generating optimized bidirectional translation:', error)
    throw error
  }
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
      return JSON.parse(content)
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
