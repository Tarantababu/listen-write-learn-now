
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language-specific word frequency lists (top 1000 most common words)
const WORD_FREQUENCIES = {
  english: {
    beginner: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'],
    intermediate: ['important', 'understand', 'example', 'between', 'different', 'experience', 'development', 'company', 'government', 'system', 'program', 'question', 'service', 'management', 'available', 'technology', 'economy', 'community', 'university', 'education', 'research', 'business', 'organization', 'individual', 'relationship', 'environment', 'communication', 'opportunity', 'responsibility', 'particularly', 'necessary', 'information', 'situation', 'material', 'financial', 'commercial', 'industrial', 'professional', 'international', 'traditional', 'significant', 'successful', 'political', 'economic', 'social', 'cultural', 'natural', 'personal', 'national', 'regional'],
    advanced: ['phenomenon', 'contemporary', 'fundamental', 'comprehensive', 'sophisticated', 'substantial', 'intellectual', 'philosophical', 'psychological', 'technological', 'theoretical', 'methodological', 'systematically', 'consequently', 'nevertheless', 'furthermore', 'predominantly', 'simultaneously', 'approximately', 'specifically', 'particularly', 'significantly', 'essentially', 'potentially', 'ultimately', 'primarily', 'subsequently', 'accordingly', 'alternatively', 'exclusively', 'extensively', 'respectively', 'presumably', 'supposedly', 'apparently', 'definitely', 'absolutely', 'relatively', 'effectively', 'efficiently', 'genuinely', 'literally', 'virtually', 'actually', 'basically', 'typically', 'generally', 'normally', 'usually', 'certainly']
  },
  spanish: {
    beginner: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'ha', 'me', 'si', 'sin', 'sobre', 'este', 'ya', 'entre', 'cuando', 'todo', 'esta', 'ser', 'son', 'dos', 'también', 'fue', 'había', 'era', 'muy', 'años', 'hasta', 'desde', 'está', 'mi', 'porque', 'qué', 'sólo', 'han', 'yo', 'hay', 'vez', 'puede', 'todos', 'así', 'nos', 'ni', 'parte', 'tiene', 'él', 'uno', 'donde', 'bien', 'tiempo', 'mismo', 'ese', 'ahora', 'cada', 'e', 'vida', 'otro', 'después', 'te', 'otros', 'aunque', 'esa', 'eso', 'hace', 'otra', 'gobierno', 'tan', 'durante', 'siempre', 'día', 'tanto', 'ella', 'tres', 'sí', 'dijo', 'sido', 'gran', 'país', 'según', 'menos', 'mundo', 'año', 'antes', 'estado', 'quiero', 'mientras', 'sin', 'sobre', 'manera', 'lugar', 'caso', 'ellos', 'derecho', 'entonces', 'primera', 'suya'],
    intermediate: ['importante', 'ejemplo', 'diferentes', 'experiencia', 'desarrollo', 'empresa', 'gobierno', 'sistema', 'programa', 'pregunta', 'servicio', 'administración', 'disponible', 'tecnología', 'economía', 'comunidad', 'universidad', 'educación', 'investigación', 'negocio', 'organización', 'individual', 'relación', 'ambiente', 'comunicación', 'oportunidad', 'responsabilidad', 'particularmente', 'necesario', 'información', 'situación', 'material', 'financiero', 'comercial', 'industrial', 'profesional', 'internacional', 'tradicional', 'significativo', 'exitoso', 'político', 'económico', 'social', 'cultural', 'natural', 'personal', 'nacional', 'regional'],
    advanced: ['fenómeno', 'contemporáneo', 'fundamental', 'comprensivo', 'sofisticado', 'sustancial', 'intelectual', 'filosófico', 'psicológico', 'tecnológico', 'teórico', 'metodológico', 'sistemáticamente', 'consecuentemente', 'sin embargo', 'además', 'predominantemente', 'simultáneamente', 'aproximadamente', 'específicamente', 'particularmente', 'significativamente', 'esencialmente', 'potencialmente', 'finalmente', 'principalmente', 'posteriormente', 'en consecuencia', 'alternativamente', 'exclusivamente', 'extensivamente', 'respectivamente', 'presumiblemente', 'supuestamente', 'aparentemente', 'definitivamente', 'absolutamente', 'relativamente', 'efectivamente', 'eficientemente', 'genuinamente', 'literalmente', 'virtualmente', 'realmente', 'básicamente', 'típicamente', 'generalmente', 'normalmente', 'usualmente', 'ciertamente']
  },
  // Add more languages as needed
};

function getRandomWord(language: string, difficulty: string): string {
  const words = WORD_FREQUENCIES[language as keyof typeof WORD_FREQUENCIES]?.[difficulty as keyof typeof WORD_FREQUENCIES['english']];
  if (!words || words.length === 0) {
    // Fallback to English if language not supported
    return WORD_FREQUENCIES.english[difficulty as keyof typeof WORD_FREQUENCIES['english']][Math.floor(Math.random() * WORD_FREQUENCIES.english[difficulty as keyof typeof WORD_FREQUENCIES['english']].length)];
  }
  return words[Math.floor(Math.random() * words.length)];
}

function createPrompt(language: string, difficulty: string, targetWord: string): string {
  const difficultyDescriptions = {
    beginner: 'simple, common vocabulary and basic sentence structures',
    intermediate: 'moderate vocabulary and varied sentence patterns',
    advanced: 'complex vocabulary and sophisticated sentence structures'
  };

  return `Create a ${difficulty} level sentence in ${language} that naturally includes the word "${targetWord}". 

Requirements:
- The sentence should be ${difficultyDescriptions[difficulty as keyof typeof difficultyDescriptions]}
- The word "${targetWord}" should fit naturally in the context
- The sentence should be educational and meaningful
- Length: ${difficulty === 'beginner' ? '8-12' : difficulty === 'intermediate' ? '12-18' : '15-25'} words

Provide your response in the following JSON format:
{
  "sentence": "The complete sentence with the target word",
  "context": "Brief explanation of the context or situation (optional)",
  "targetWord": "${targetWord}"
}

Example for reference:
If targetWord is "important" and difficulty is "intermediate":
{
  "sentence": "It is important to understand different perspectives before making a decision.",
  "context": "This sentence emphasizes the value of considering multiple viewpoints in decision-making.",
  "targetWord": "important"
}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { language, difficulty, knownWords } = await req.json();
    
    if (!language || !difficulty) {
      throw new Error('Language and difficulty are required');
    }

    console.log(`Generating sentence for ${language} at ${difficulty} level`);

    // Get a random word for the given difficulty
    const targetWord = getRandomWord(language, difficulty);
    console.log(`Selected target word: ${targetWord}`);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate sentence using OpenAI
    const prompt = createPrompt(language, difficulty, targetWord);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a language learning expert. Create educational sentences that help students learn vocabulary in context. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Generated content:', content);

    // Parse the JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse JSON:', content);
      throw new Error('Invalid response format from AI');
    }

    // Validate the response
    if (!parsedContent.sentence || !parsedContent.targetWord) {
      throw new Error('Invalid response structure from AI');
    }

    // Create the cloze sentence by replacing the target word with a blank
    const clozeSentence = parsedContent.sentence.replace(
      new RegExp(`\\b${parsedContent.targetWord}\\b`, 'gi'),
      '___'
    );

    const result = {
      sentence: parsedContent.sentence,
      targetWord: parsedContent.targetWord,
      clozeSentence: clozeSentence,
      context: parsedContent.context || '',
      difficulty: difficulty,
      language: language
    };

    console.log('Final result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-sentence-mining function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate sentence mining exercise' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
