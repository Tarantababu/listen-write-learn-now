
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const FUNCTION_TIMEOUT = 50000;
const OPENAI_TIMEOUT = 35000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now();
  let timeoutController = new AbortController();
  
  const functionTimeout = setTimeout(() => {
    timeoutController.abort();
  }, FUNCTION_TIMEOUT);

  try {
    const { 
      topic, 
      language, 
      difficulty_level, 
      target_length = 500,
      grammar_focus,
      customText,
      isCustomText = false
    } = await req.json()

    if (!openAIApiKey && !isCustomText) {
      throw new Error('OpenAI API key not configured')
    }

    console.log(`[SIMPLIFIED GENERATION] Custom text: ${isCustomText}, Target: ${target_length} words`);

    let content;

    if (isCustomText && customText) {
      // For custom text, just return the text as-is without AI processing
      content = {
        text: customText.trim(),
        metadata: {
          generation_method: 'custom_text',
          original_length: customText.length,
          word_count: customText.split(/\s+/).filter(word => word.length > 0).length,
          processing_type: 'direct_input'
        }
      };
    } else {
      // For AI generation, create the content using OpenAI
      content = await generateContentWithAI(
        topic, language, difficulty_level, target_length, grammar_focus, 
        timeoutController.signal
      );
    }

    clearTimeout(functionTimeout);
    
    const duration = Date.now() - startTime;
    console.log(`[SIMPLIFIED SUCCESS] Completed in ${duration}ms, Generated ${content.metadata?.word_count || 0} words`);

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    clearTimeout(functionTimeout);
    const duration = Date.now() - startTime;
    
    console.error(`[SIMPLIFIED ERROR] After ${duration}ms:`, error);
    
    // Enhanced error handling with smart recovery
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      console.warn('[SMART RECOVERY] Using intelligent fallback due to timeout');
      const fallbackContent = generateSimpleFallback(target_length || 500, language, topic, difficulty_level);
      
      return new Response(JSON.stringify(fallbackContent), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback_content: generateSimpleFallback(target_length || 500, language, topic, difficulty_level)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateContentWithAI(
  topic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  signal?: AbortSignal
) {
  console.log(`[AI GENERATION] Creating ${target_length} words about ${topic}`);
  
  const prompt = createSimplePrompt(topic, language, difficulty_level, target_length, grammar_focus);
  
  try {
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
            content: 'You are an expert language teacher. Create educational content that is engaging and appropriate for the specified level. Always respond with just the text content, no formatting or additional structure.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: calculateTokens(target_length),
      }),
      signal: signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI GENERATION ERROR] ${response.status}: ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content.trim();
    
    const wordCount = generatedText.split(/\s+/).filter(word => word.length > 0).length;
    
    console.log(`[AI GENERATION SUCCESS] Generated ${wordCount} words`);
    
    return {
      text: generatedText,
      metadata: {
        generation_method: 'ai_generated',
        word_count: wordCount,
        target_length: target_length,
        topic: topic,
        language: language,
        difficulty_level: difficulty_level,
        grammar_focus: grammar_focus,
        processing_type: 'openai_completion'
      }
    };
  } catch (error) {
    console.error('Error in generateContentWithAI:', error);
    throw error;
  }
}

function createSimplePrompt(topic: string, language: string, difficulty: string, targetLength: number, grammarFocus?: string): string {
  return `Write a ${language} text about ${topic} for ${difficulty} level learners.

Requirements:
- Write approximately ${targetLength} words
- Use vocabulary appropriate for ${difficulty} level
- Create natural, flowing sentences
- Make the content engaging and educational
${grammarFocus ? `- Focus on using ${grammarFocus} grammar structures` : ''}

Write only the text content without any formatting, titles, or additional structure. Just provide the readable text.`;
}

function calculateTokens(targetLength: number): number {
  // Rough estimate: 1 word ≈ 1.3 tokens, plus some buffer for response
  return Math.min(4000, Math.ceil(targetLength * 1.5) + 500);
}

function generateSimpleFallback(target_length: number, language: string, topic?: string, difficulty?: string) {
  console.log('[SIMPLE FALLBACK] Creating fallback content');
  
  const sentences = [
    `This is a ${language} reading exercise about ${topic || 'general topics'}.`,
    `The content is designed for ${difficulty || 'intermediate'} level learners.`,
    `Reading exercises help improve vocabulary and comprehension skills.`,
    `Practice regularly to see improvement in your language abilities.`,
    `This fallback content ensures you always have something to read.`
  ];
  
  const fallbackText = sentences.join(' ');
  const wordCount = fallbackText.split(/\s+/).filter(word => word.length > 0).length;
  
  return {
    text: fallbackText,
    metadata: {
      generation_method: 'fallback',
      word_count: wordCount,
      target_length: target_length,
      processing_type: 'emergency_fallback',
      fallback_reason: 'System protection activated'
    }
  };
}
