
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      difficulty_level, 
      language, 
      exercise_type, 
      session_id,
      known_words = [],
      previous_sentences = [],
      n_plus_one = false
    } = await req.json();

    console.log(`Generating exercise for target language: ${language} difficulty: ${difficulty_level} type: ${exercise_type}`);

    // Build the prompt based on N+1 methodology
    let prompt = `Generate a sentence mining exercise with the following requirements:

Language: ${language}
Difficulty: ${difficulty_level}
Exercise Type: ${exercise_type}
`;

    if (n_plus_one && known_words.length > 0) {
      prompt += `
N+1 Methodology: The sentence should contain mostly known words with only 1-2 unknown words.
Known words (use these as base vocabulary): ${known_words.slice(0, 50).join(', ')}
`;
    }

    if (previous_sentences.length > 0) {
      prompt += `
Avoid repetition: Do not use these previously seen sentences or very similar structures:
${previous_sentences.slice(-10).join('\n')}
`;
    }

    prompt += `
Requirements:
1. Create a natural, contextually appropriate sentence IN ${language.toUpperCase()}
2. Ensure the sentence follows ${n_plus_one ? 'N+1 methodology (mostly known words + 1-2 new words)' : 'appropriate difficulty level'}
3. Provide accurate English translation
4. Identify 2-4 target words based on exercise type
5. Make the sentence different from previously seen content
6. Focus on practical, everyday language usage
7. IMPORTANT: The sentence must be written in ${language}, not English

Return a JSON object with:
- sentence: The ${language} sentence (NOT English)
- translation: English translation of the ${language} sentence
- targetWords: Array of 2-4 key words from the ${language} sentence to focus on
- exerciseType: "${exercise_type}"
- difficultyScore: Number from 1-10
- unknownWords: Array of words from the ${language} sentence that might be unknown to learners
- context: Brief context about the sentence usage

Example format:
{
  "sentence": "Example sentence in ${language}",
  "translation": "English translation",
  "targetWords": ["word1", "word2"],
  "exerciseType": "${exercise_type}",
  "difficultyScore": 5,
  "unknownWords": ["difficult1", "difficult2"],
  "context": "This sentence is used when..."
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: `You are a language learning expert specializing in sentence mining and the N+1 methodology. Create engaging, practical exercises that help learners acquire vocabulary naturally through context. Always generate sentences in the target language specified by the user, never in English unless English is the target language.` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    const content = data.choices[0].message.content;
    console.log('OpenAI response content:', content);

    // Parse the JSON response, handling potential markdown formatting
    let exercise;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      exercise = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw content:', content);
      
      // Fallback: create a basic exercise in the target language
      const fallbackSentences = {
        german: "Das ist ein einfacher Satz.",
        spanish: "Esta es una oración simple.",
        french: "C'est une phrase simple.",
        portuguese: "Esta é uma frase simples.",
        italian: "Questa è una frase semplice.",
        turkish: "Bu basit bir cümledir.",
        swedish: "Det här är en enkel mening.",
        dutch: "Dit is een eenvoudige zin.",
        norwegian: "Dette er en enkel setning.",
        russian: "Это простое предложение.",
        polish: "To jest proste zdanie.",
        chinese: "这是一个简单的句子。",
        japanese: "これは簡単な文です。",
        korean: "이것은 간단한 문장입니다.",
        arabic: "هذه جملة بسيطة.",
        english: "This is a simple sentence."
      };

      const fallbackTranslations = {
        german: "This is a simple sentence.",
        spanish: "This is a simple sentence.",
        french: "This is a simple sentence.",
        portuguese: "This is a simple sentence.",
        italian: "This is a simple sentence.",
        turkish: "This is a simple sentence.",
        swedish: "This is a simple sentence.",
        dutch: "This is a simple sentence.",
        norwegian: "This is a simple sentence.",
        russian: "This is a simple sentence.",
        polish: "This is a simple sentence.",
        chinese: "This is a simple sentence.",
        japanese: "This is a simple sentence.",
        korean: "This is a simple sentence.",
        arabic: "This is a simple sentence.",
        english: "This is a simple sentence."
      };

      exercise = {
        sentence: fallbackSentences[language as keyof typeof fallbackSentences] || fallbackSentences.english,
        translation: fallbackTranslations[language as keyof typeof fallbackTranslations] || fallbackTranslations.english,
        targetWords: ["simple"],
        exerciseType: exercise_type,
        difficultyScore: 3,
        unknownWords: ["simple"],
        context: "This is a fallback sentence."
      };
    }

    // Ensure the exercise has the correct structure
    const finalExercise = {
      sentence: exercise.sentence || "Sample sentence",
      translation: exercise.translation || "Sample translation",
      targetWords: exercise.targetWords || ["sample"],
      exerciseType: exercise_type,
      difficultyScore: exercise.difficultyScore || 5,
      unknownWords: exercise.unknownWords || [],
      context: exercise.context || "Sample context",
      correctAnswer: exercise_type === 'translation' ? exercise.translation : exercise.sentence,
      difficulty: difficulty_level,
      createdAt: new Date(),
      attempts: 0,
      correctAttempts: 0,
      clozeSentence: exercise_type === 'cloze' ? generateClozeSentence(exercise.sentence, exercise.targetWords) : exercise.sentence,
      id: crypto.randomUUID()
    };

    console.log('Final exercise generated:', finalExercise);

    return new Response(JSON.stringify(finalExercise), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-sentence-mining function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateClozeSentence(sentence: string, targetWords: string[]): string {
  let clozeSentence = sentence;
  
  // Replace target words with blanks
  targetWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    clozeSentence = clozeSentence.replace(regex, '___');
  });
  
  return clozeSentence;
}
