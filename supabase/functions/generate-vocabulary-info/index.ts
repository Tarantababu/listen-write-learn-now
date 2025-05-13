
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

interface RequestBody {
  text: string
  language: string
}

interface VocabularyInfo {
  definition: string
  exampleSentence: string
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

    console.log(`Generating vocabulary info for "${text.substring(0, 20)}..." in ${language}`)

    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    const vocabularyData = await generateVocabularyInfo(text, language, openAIApiKey)
    
    return new Response(
      JSON.stringify(vocabularyData),
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

async function generateVocabularyInfo(
  word: string, 
  language: string, 
  apiKey: string
): Promise<VocabularyInfo> {
  const prompt = `
Provide vocabulary information about this ${language} word/phrase: "${word}"

Return a JSON object with the following structure:
{
  "definition": "Clear and comprehensive English definition or translation",
  "exampleSentence": "An example sentence in ${language} using this word/phrase"
}

Notes:
- The definition should be a clear English explanation/translation
- For languages other than English, include any relevant grammatical details (gender, etc.)
- The example sentence should be in ${language}
- Format must be valid JSON
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
          { role: 'system', content: 'You are a language teacher assistant that provides vocabulary information. Always respond in the exact JSON format requested.' },
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
      
      // Return a fallback object
      return {
        definition: `Failed to get definition for "${word}" in ${language}`,
        exampleSentence: `Example with "${word}".`
      }
    }
  } catch (error) {
    console.error('Error generating vocabulary info:', error)
    throw error
  }
}
