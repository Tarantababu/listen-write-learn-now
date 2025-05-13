
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

interface RequestBody {
  text: string
  language: string
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, language } = await req.json() as RequestBody

    if (!text || !language) {
      return new Response(
        JSON.stringify({ error: 'Text and language are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`Generating reading analysis for "${text.substring(0, 20)}..." in ${language}`)

    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    // Split the text into sentences
    const rawSentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)

    // Get English translation if the text is not in English
    let englishTranslation = null
    if (language.toLowerCase() !== 'english') {
      englishTranslation = await getOpenAITranslation(text, language, openAIApiKey)
    }

    // Process each sentence with OpenAI
    const sentencesPromises = rawSentences.map(async (sentenceText) => {
      const sentenceAnalysis = await analyzeSentence(sentenceText, language, openAIApiKey)
      return {
        text: sentenceText.trim(),
        analysis: sentenceAnalysis
      }
    })

    // Execute all promises in parallel
    const sentences = await Promise.all(sentencesPromises)

    // Get common patterns for the entire text
    const commonPatterns = await getCommonPatterns(text, language, openAIApiKey)

    // Get summary of the text
    const summary = await getTextSummary(text, language, openAIApiKey)

    // Assemble the complete analysis content
    const analysis: AnalysisContent = {
      sentences,
      commonPatterns,
      summary,
      englishTranslation
    }

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

async function analyzeSentence(
  sentence: string, 
  language: string, 
  apiKey: string
): Promise<{ words: AnalysisWord[], grammarInsights: string[], structure: string }> {
  const prompt = `
Analyze this ${language} sentence: "${sentence}"

Provide a detailed analysis in the following JSON format:
{
  "words": [
    {
      "word": "word1",
      "definition": "English meaning and translation",
      "exampleSentence": "An example sentence using this word"
    },
    ...
  ],
  "grammarInsights": [
    "Grammar insight 1",
    "Grammar insight 2",
    ...
  ],
  "structure": "Explanation of the sentence structure"
}

Notes:
- For "words", select the 3-5 most important words in the sentence 
- For each word, provide its meaning in English (clear translation)
- For "grammarInsights", provide 2-3 insights about grammar used in the sentence
- For "structure", explain the sentence structure in one concise paragraph
- Format must be valid JSON
`

  const result = await callOpenAI(prompt, apiKey)
  
  try {
    return JSON.parse(result)
  } catch (e) {
    console.error('Failed to parse sentence analysis:', e)
    console.log('Raw response:', result)
    return {
      words: [{ 
        word: sentence.split(' ')[0], 
        definition: "Analysis failed to parse", 
        exampleSentence: sentence 
      }],
      grammarInsights: ["Unable to analyze grammar"],
      structure: "Unable to analyze structure"
    }
  }
}

async function getCommonPatterns(
  text: string, 
  language: string, 
  apiKey: string
): Promise<string[]> {
  const prompt = `
Analyze this ${language} text and identify 3-4 common language patterns. Return only an array of strings in valid JSON format, like this:
["Pattern 1 description", "Pattern 2 description", ...]

Text: "${text.substring(0, 500)}${text.length > 500 ? '...' : ''}"
`

  const result = await callOpenAI(prompt, apiKey)
  
  try {
    return JSON.parse(result)
  } catch (e) {
    console.error('Failed to parse common patterns:', e)
    return ["Unable to identify language patterns"]
  }
}

async function getTextSummary(
  text: string, 
  language: string, 
  apiKey: string
): Promise<string> {
  const prompt = `
Write a concise summary in English of this ${language} text (about 2-3 sentences):

"${text.substring(0, 500)}${text.length > 500 ? '...' : ''}"

Return only the summary text, no quotes or formatting.
`

  return await callOpenAI(prompt, apiKey)
}

async function getOpenAITranslation(
  text: string,
  language: string,
  apiKey: string
): Promise<string> {
  const prompt = `
Translate this ${language} text to natural English:

"${text}"

Return only the translation, no additional comments or formatting.
`

  return await callOpenAI(prompt, apiKey)
}

async function callOpenAI(
  prompt: string,
  apiKey: string
): Promise<string> {
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
          { role: 'system', content: 'You are a language analysis assistant that provides structured analysis of text. Always respond in the exact format requested.' },
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
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('Error calling OpenAI:', error)
    throw error
  }
}
