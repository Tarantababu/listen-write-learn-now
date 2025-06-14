
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      topic, 
      language, 
      difficulty_level, 
      target_length, 
      grammar_focus,
      customText,
      isCustomText = false
    } = await req.json()

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    let content;

    if (isCustomText && customText) {
      // Process custom text
      content = await processCustomText(customText, language, difficulty_level, grammar_focus);
    } else {
      // Generate AI content with retry logic for word count
      content = await generateAIContentWithRetry(topic, language, difficulty_level, target_length, grammar_focus);
    }

    return new Response(JSON.stringify(content), {
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

async function processCustomText(customText: string, language: string, difficulty_level: string, grammar_focus?: string) {
  const prompt = `Analyze and enhance this custom text for ${difficulty_level} level ${language} learners.

Original text: "${customText}"
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

Requirements:
1. Break the text into 5-12 natural sentences that flow well together
2. For each sentence, provide comprehensive analysis:
   - Original text (keep it exactly as provided, only fix obvious typos)
   - Detailed word analysis with definitions, parts of speech, and difficulty levels
   - Grammar points covered in that sentence
   - Natural translation to English (if the target language isn't English)
3. Make vocabulary analysis appropriate for ${difficulty_level} level
4. Preserve the original meaning and style as much as possible
5. If the text has errors, gently correct them while maintaining the author's voice

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
    "wordCount": ${customText.split(' ').length},
    "readingTime": ${Math.ceil(customText.split(' ').length / 200)},
    "grammarPoints": ["overall grammar concepts covered"]
  }
}`

  return await callOpenAI(prompt, language, 4000); // Fixed token limit for custom text
}

async function generateAIContentWithRetry(topic: string, language: string, difficulty_level: string, target_length: number, grammar_focus?: string) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`Generating content attempt ${attempt + 1}/${maxRetries} for ${target_length} words`);
      
      const content = await generateAIContent(topic, language, difficulty_level, target_length, grammar_focus);
      
      // Validate word count
      const actualWordCount = content.analysis?.wordCount || 0;
      const minExpectedWords = Math.floor(target_length * 0.8); // Allow 20% variance
      
      console.log(`Generated ${actualWordCount} words, target: ${target_length}, minimum: ${minExpectedWords}`);
      
      if (actualWordCount >= minExpectedWords) {
        console.log('Word count validation passed');
        return content;
      } else {
        console.log(`Word count too low (${actualWordCount}/${minExpectedWords}), retrying...`);
        attempt++;
        
        if (attempt === maxRetries) {
          console.warn('Max retries reached, returning content with lower word count');
          return content;
        }
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      attempt++;
      
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}

async function generateAIContent(topic: string, language: string, difficulty_level: string, target_length: number, grammar_focus?: string) {
  const prompt = `Create an engaging reading exercise in ${language} for ${difficulty_level} level learners.

Topic: ${topic}
TARGET WORD COUNT: EXACTLY ${target_length} words - this is critical!
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

CRITICAL REQUIREMENTS:
1. The text MUST contain approximately ${target_length} words total across all sentences
2. Create a cohesive, interesting passage about the topic with ${target_length} words
3. Split the text into 8-15 natural sentences that flow well together
4. Each sentence should be substantial and contribute to reaching the ${target_length} word target
5. For each sentence, provide comprehensive analysis:
   - Original text
   - Detailed word analysis with definitions, parts of speech, and difficulty levels
   - Grammar points covered in that sentence
   - Natural translation to English (if the target language isn't English)
6. Make vocabulary and grammar appropriate for ${difficulty_level} level
7. Include varied sentence structures and engaging content
8. Ensure cultural authenticity and relevance

WORD COUNT TARGET: ${target_length} words - do not create shorter content!

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
    "readingTime": ${Math.ceil(target_length / 200)},
    "grammarPoints": ["overall grammar concepts covered"]
  }
}`

  // Calculate dynamic token limit based on target length
  const dynamicMaxTokens = calculateTokenLimit(target_length);
  console.log(`Using dynamic token limit: ${dynamicMaxTokens} for target length: ${target_length}`);
  
  return await callOpenAI(prompt, language, dynamicMaxTokens);
}

function calculateTokenLimit(target_length: number): number {
  // Base calculation: approximate tokens needed for the content plus analysis
  // Rough estimate: 1 word ≈ 1.3 tokens, plus overhead for JSON structure and analysis
  const contentTokens = Math.ceil(target_length * 1.3);
  const analysisOverhead = Math.ceil(target_length * 0.5); // For word definitions, grammar points, etc.
  const jsonOverhead = 500; // For JSON structure
  
  const calculatedLimit = contentTokens + analysisOverhead + jsonOverhead;
  
  // Set reasonable bounds
  const minTokens = 2000;
  const maxTokens = 16000; // OpenAI's model limit
  
  const finalLimit = Math.max(minTokens, Math.min(maxTokens, calculatedLimit));
  
  console.log(`Token calculation: target_length=${target_length}, content_tokens=${contentTokens}, analysis_overhead=${analysisOverhead}, final_limit=${finalLimit}`);
  
  return finalLimit;
}

async function callOpenAI(prompt: string, language: string, maxTokens: number) {
  console.log(`Calling OpenAI with max_tokens: ${maxTokens}`);
  
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
          content: `You are an expert language teacher creating high-quality reading exercises. You create authentic, culturally relevant content that is perfectly calibrated for language learners. You MUST respond with valid JSON only, no additional text or formatting. Make sure every word in the vocabulary analysis is actually present in the text. CRITICAL: You must generate content that meets the exact word count specified in the user prompt.`
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
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`OpenAI API error: ${response.status} - ${errorText}`)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  console.log('Raw OpenAI response length:', content.length);

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

  // Calculate actual word count from sentences
  const actualWordCount = parsedContent.sentences.reduce((count: number, sentence: any) => {
    return count + (sentence.text?.split(' ').length || 0);
  }, 0);

  // Ensure analysis exists with correct word count
  if (!parsedContent.analysis) {
    parsedContent.analysis = {
      wordCount: actualWordCount,
      readingTime: Math.ceil(actualWordCount / 200),
      grammarPoints: []
    }
  } else {
    // Update word count with actual count
    parsedContent.analysis.wordCount = actualWordCount;
    parsedContent.analysis.readingTime = Math.ceil(actualWordCount / 200);
  }

  console.log(`Successfully processed reading content with ${actualWordCount} words`);
  return parsedContent;
}
