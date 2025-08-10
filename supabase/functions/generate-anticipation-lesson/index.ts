
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

interface RequestBody {
  targetLanguage: string
  conversationTheme: string
  difficultyLevel: string
}

interface LessonContent {
  sections: Array<{
    type: string
    title: string
    content: any[]
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { targetLanguage, conversationTheme, difficultyLevel } = await req.json() as RequestBody

    if (!targetLanguage || !conversationTheme || !difficultyLevel) {
      return new Response(
        JSON.stringify({ error: 'Target language, conversation theme, and difficulty level are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    const lessonContent = await generateLessonContent(
      targetLanguage, 
      conversationTheme, 
      difficultyLevel, 
      openAIApiKey
    )
    
    return new Response(
      JSON.stringify(lessonContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function generateLessonContent(
  targetLanguage: string,
  conversationTheme: string,
  difficultyLevel: string,
  apiKey: string
): Promise<LessonContent> {
  const prompt = `
Create a structured language learning lesson for the "Principle of Anticipation" method.

Target Language: ${targetLanguage}
Conversation Theme: ${conversationTheme}
Difficulty Level: ${difficultyLevel}

Generate a JSON response with exactly this structure:
{
  "sections": [
    {
      "type": "introduction",
      "title": "Lesson Introduction",
      "content": [
        {"speaker": "EN", "text": "Welcome message and lesson overview", "audioType": "normal"},
        {"speaker": "EN", "text": "Explanation of anticipation method", "audioType": "normal"}
      ]
    },
    {
      "type": "cultural_insight",
      "title": "Cultural Insight",
      "content": [
        {"speaker": "EN", "text": "Cultural context about the theme", "audioType": "normal"}
      ]
    },
    {
      "type": "vocabulary",
      "title": "Vocabulary Training",
      "content": [
        {
          "english": "English word/phrase",
          "target": "Target language translation",
          "exampleEN": "English example sentence",
          "exampleTL": "Target language example",
          "anticipationPrompt": "Try to guess the ${targetLanguage} word for..."
        }
      ]
    },
    {
      "type": "dialogue",
      "title": "Contextual Dialogue",
      "content": [
        {
          "targetText": "Target language sentence",
          "englishMeaning": "English translation",
          "anticipationPrompt": "What might they say next in ${targetLanguage}?"
        }
      ]
    },
    {
      "type": "expansion",
      "title": "Vocabulary Expansion",
      "content": [
        {
          "english": "Related English word",
          "target": "Target language word",
          "example": "Example sentence in target language"
        }
      ]
    },
    {
      "type": "transformation",
      "title": "Transformation Practice",
      "content": [
        {
          "prompt": "Transform this statement into a question",
          "english": "English statement",
          "targetAnswer": "Target language question",
          "anticipationPrompt": "How would you ask this in ${targetLanguage}?"
        }
      ]
    },
    {
      "type": "production",
      "title": "Production Practice",
      "content": [
        {
          "prompt": "Build a complete sentence",
          "fragments": ["word1", "word2", "word3"],
          "targetSentence": "Complete target language sentence",
          "anticipationPrompt": "Try to form a complete sentence using these words"
        }
      ]
    },
    {
      "type": "recap",
      "title": "Recap & Farewell",
      "content": [
        {"speaker": "EN", "text": "Lesson summary", "audioType": "normal"},
        {"speaker": "TL", "text": "Goodbye in target language", "audioType": "normal"}
      ]
    }
  ]
}

Requirements:
- Keep sentences short and TTS-friendly
- Match ${difficultyLevel} complexity level
- Include 5-7 vocabulary items
- Create 4-6 dialogue lines
- Add anticipation prompts throughout
- Make content culturally relevant to ${conversationTheme}
- All text should be appropriate for text-to-speech generation
`;

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
            content: 'You are an expert language teacher creating anticipation-based lessons. Always respond with valid JSON in the exact format requested.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    try {
      return JSON.parse(content)
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e)
      console.log('Raw response:', content)
      
      // Return a fallback lesson structure
      return {
        sections: [
          {
            type: "introduction",
            title: "Lesson Introduction",
            content: [
              { speaker: "EN", text: `Welcome to your ${targetLanguage} lesson on ${conversationTheme}!`, audioType: "normal" }
            ]
          }
        ]
      }
    }
  } catch (error) {
    console.error('Error generating lesson content:', error)
    throw error
  }
}
