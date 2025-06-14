
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { topic, language, difficulty_level, target_length, grammar_focus } = await req.json()

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `Create a reading exercise in ${language} for ${difficulty_level} level learners.

Topic: ${topic}
Target length: approximately ${target_length} words
${grammar_focus ? `Focus on grammar: ${grammar_focus}` : ''}

Requirements:
1. Create an engaging text about the topic
2. Split the text into 5-8 natural sentences
3. For each sentence, provide:
   - The original text
   - Word-level analysis (definitions, part of speech, difficulty)
   - Grammar points covered
   - Translation to English (if not English)
4. Make it appropriate for ${difficulty_level} level

Return JSON in this exact format:
{
  "sentences": [
    {
      "id": "unique-id",
      "text": "sentence text",
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
    "wordCount": number,
    "readingTime": number,
    "grammarPoints": ["overall grammar points covered"]
  }
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert language teacher creating reading exercises. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Parse the JSON response
    let parsedContent
    try {
      parsedContent = JSON.parse(content)
    } catch (e) {
      throw new Error('Failed to parse OpenAI response as JSON')
    }

    // Add unique IDs to sentences if not present
    parsedContent.sentences = parsedContent.sentences.map((sentence: any, index: number) => ({
      ...sentence,
      id: sentence.id || `sentence-${index + 1}`
    }))

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in generate-reading-content function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
