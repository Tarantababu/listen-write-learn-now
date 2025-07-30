
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
      session_id,
      known_words = [],
      previous_sentences = [],
      n_plus_one = false
    } = await req.json();

    console.log(`Generating cloze exercise for language: ${language}, difficulty: ${difficulty_level}`);

    // Build the prompt for cloze exercises only
    let prompt = `Generate a cloze (fill-in-the-blank) sentence exercise with the following requirements:

Language: ${language}
Difficulty: ${difficulty_level}
Exercise Type: Cloze (fill-in-the-blank)

Requirements:
1. Create a natural, contextually appropriate sentence in ${language.toUpperCase()}
2. Choose ONE key word from the sentence to be the target word for the blank
3. The target word should be appropriate for ${difficulty_level} level learners
4. Provide accurate English translation
5. Create a cloze sentence by replacing the target word with "___"
6. Focus on practical, everyday language usage
7. Make the sentence interesting and memorable

`;

    if (n_plus_one && known_words.length > 0) {
      prompt += `N+1 Methodology: Use mostly familiar words with one new challenging word.
Known words (use as base vocabulary): ${known_words.slice(0, 30).join(', ')}

`;
    }

    if (previous_sentences.length > 0) {
      prompt += `Avoid repetition of these previous sentences:
${previous_sentences.slice(-5).join('\n')}

`;
    }

    prompt += `Return a JSON object with:
- sentence: The complete ${language} sentence
- translation: English translation 
- targetWord: The single word that should fill the blank
- clozeSentence: The sentence with the target word replaced by "___"
- difficultyScore: Number from 1-10
- context: Brief explanation of when to use this sentence
- hints: Array with one helpful hint (optional)

Example format:
{
  "sentence": "Complete sentence in ${language}",
  "translation": "English translation",
  "targetWord": "word",
  "clozeSentence": "Sentence with ___ replacing the target word",
  "difficultyScore": 5,
  "context": "This sentence is used when...",
  "hints": ["Helpful hint about the target word"]
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
            content: `You are a language learning expert specializing in cloze exercises. Create engaging, practical exercises that help learners acquire vocabulary naturally through context. Always generate sentences in the target language specified by the user.` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    const content = data.choices[0].message.content;
    console.log('OpenAI response content:', content);

    // Parse the JSON response
    let exercise;
    try {
      const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      exercise = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw content:', content);
      
      // Fallback exercise
      const fallbackSentences = {
        german: "Das ist ein einfacher Satz.",
        spanish: "Esta es una oración simple.",
        french: "C'est une phrase simple.",
        portuguese: "Esta é uma frase simples.",
        italian: "Questa è una frase semplice.",
        english: "This is a simple sentence."
      };

      const fallbackTargetWords = {
        german: "einfacher",
        spanish: "simple",
        french: "simple",
        portuguese: "simples",
        italian: "semplice",
        english: "simple"
      };

      const sentence = fallbackSentences[language as keyof typeof fallbackSentences] || fallbackSentences.english;
      const targetWord = fallbackTargetWords[language as keyof typeof fallbackTargetWords] || fallbackTargetWords.english;

      exercise = {
        sentence,
        translation: "This is a simple sentence.",
        targetWord,
        clozeSentence: sentence.replace(targetWord, "___"),
        difficultyScore: 3,
        context: "This is a fallback sentence.",
        hints: [`Think of a word meaning 'easy' or 'not complex'`]
      };
    }

    // Ensure the exercise has the correct structure for cloze
    const finalExercise = {
      sentence: exercise.sentence || "Sample sentence",
      translation: exercise.translation || "Sample translation",
      targetWord: exercise.targetWord || "sample",
      clozeSentence: exercise.clozeSentence || exercise.sentence?.replace(exercise.targetWord, "___") || "Sample ___",
      difficultyScore: exercise.difficultyScore || 5,
      context: exercise.context || "Sample context",
      hints: exercise.hints || [],
      correctAnswer: exercise.targetWord || "sample",
      difficulty: difficulty_level,
      exerciseType: 'cloze',
      createdAt: new Date(),
      attempts: 0,
      correctAttempts: 0,
      id: crypto.randomUUID()
    };

    console.log('Final cloze exercise generated:', finalExercise);

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
