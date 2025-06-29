
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

interface RequestBody {
  text: string
  language: string
  requestShort?: boolean
  requestExplanation?: boolean
}

interface VocabularyInfo {
  definition: string
  exampleSentence: string
  explanation?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, language, requestShort = false, requestExplanation = false } = await req.json() as RequestBody

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

    const vocabularyData = await generateVocabularyInfo(text, language, openAIApiKey, requestShort, requestExplanation)
    
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
  apiKey: string,
  requestShort: boolean = false,
  requestExplanation: boolean = false
): Promise<VocabularyInfo> {
  let prompt = '';
  
  if (requestExplanation) {
    prompt = `
Provide an explanation for this language learning scenario: "${word}"

Return a JSON object with the following structure:
{
  "explanation": "Clear, helpful explanation for the language learner"
}

Notes:
- Focus on why the correct answer is better
- Explain grammar rules or usage patterns
- Keep it concise but educational
- Format must be valid JSON
`;
  } else if (requestShort) {
    prompt = `
Provide a very short translation (1-2 words maximum) for this ${language} word/phrase: "${word}"

Return a JSON object with the following structure:
{
  "definition": "1-2 word English translation (key meaning only)",
  "exampleSentence": "An example sentence in ${language} using this word/phrase"
}

Notes:
- Definition must be extremely concise (1-2 words only)
- Remove articles (a, an, the) from the translation
- Focus on the core meaning only
- Format must be valid JSON
`;
  } else {
    prompt = `
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
`;
  }

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
      if (requestExplanation) {
        return {
          definition: '',
          exampleSentence: '',
          explanation: `Please review the correct answer and practice more.`
        }
      } else {
        return {
          definition: requestShort ? 'translation' : `Failed to get definition for "${word}" in ${language}`,
          exampleSentence: `Example with "${word}".`
        }
      }
    }
  } catch (error) {
    console.error('Error generating vocabulary info:', error)
    throw error
  }
}
