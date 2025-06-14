
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

    const prompt = `Create an engaging reading exercise in ${language} for ${difficulty_level} level learners.

Topic: ${topic}
Target length: approximately ${target_length} words
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

Requirements:
1. Create a cohesive, interesting passage about the topic
2. Split the text into 5-8 natural sentences that flow well together
3. For each sentence, provide comprehensive analysis:
   - Original text
   - Detailed word analysis with definitions, parts of speech, and difficulty levels
   - Grammar points covered in that sentence
   - Natural translation to English (if the target language isn't English)
4. Make vocabulary and grammar appropriate for ${difficulty_level} level
5. Include varied sentence structures and engaging content
6. Ensure cultural authenticity and relevance

IMPORTANT: Return ONLY valid JSON in this exact format, no additional text or formatting:
{
  "sentences": [
    {
      "id": "sentence-1",
      "text": "sentence text in ${language}",
      "analysis": {
        "words": [
          {
            "word": "word",
            "definition": "clear, helpful definition",
            "partOfSpeech": "noun/verb/adjective/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["specific grammar points used in this sentence"],
        "translation": "natural English translation"
      }
    }
  ],
  "analysis": {
    "wordCount": ${target_length},
    "readingTime": 2,
    "grammarPoints": ["overall grammar concepts covered"]
  }
}`

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
            content: `You are an expert language teacher creating high-quality reading exercises. You create authentic, culturally relevant content that is perfectly calibrated for language learners. You MUST respond with valid JSON only, no additional text or formatting. Make sure every word in the vocabulary analysis is actually present in the text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenAI API error: ${response.status} - ${errorText}`)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    console.log('Raw OpenAI response:', content)

    // Parse the JSON response with better error handling
    let parsedContent
    try {
      parsedContent = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      console.error('Parse error:', parseError.message)
      
      // Try to extract JSON from the response if it's wrapped in other text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedContent = JSON.parse(jsonMatch[0])
          console.log('Successfully extracted JSON from wrapped response')
        } catch (extractError) {
          console.error('Failed to extract JSON:', extractError.message)
          throw new Error('Failed to parse OpenAI response as JSON')
        }
      } else {
        throw new Error('No valid JSON found in OpenAI response')
      }
    }

    // Validate and fix the structure
    if (!parsedContent.sentences || !Array.isArray(parsedContent.sentences)) {
      throw new Error('Invalid response structure: missing sentences array')
    }

    // Add unique IDs to sentences if not present and validate structure
    parsedContent.sentences = parsedContent.sentences.map((sentence: any, index: number) => ({
      ...sentence,
      id: sentence.id || `sentence-${index + 1}`,
      analysis: {
        words: sentence.analysis?.words || [],
        grammar: sentence.analysis?.grammar || [],
        translation: sentence.analysis?.translation || ''
      }
    }))

    // Ensure analysis exists
    if (!parsedContent.analysis) {
      parsedContent.analysis = {
        wordCount: target_length,
        readingTime: Math.ceil(target_length / 200),
        grammarPoints: grammar_focus ? [grammar_focus] : []
      }
    }

    console.log('Successfully processed reading content')
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
