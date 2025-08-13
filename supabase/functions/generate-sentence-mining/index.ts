
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      targetWords, 
      language, 
      difficulty, 
      exerciseType, 
      userId, 
      sessionId,
      progressionData 
    } = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's progression context for AI
    const { data: userProgression } = await supabase
      .from('user_word_progression')
      .select('word, mastery_level, progression_stage')
      .eq('user_id', userId)
      .eq('language', language)
      .in('progression_stage', ['mastered', 'consolidating']);

    const masteredWords = userProgression?.map(w => w.word) || [];
    const currentComplexity = progressionData?.recommendedComplexity || 50;

    // Enhanced AI prompt for progressive vocabulary
    const aiPrompt = `You are an advanced language learning AI that creates progressive sentence mining exercises.

Context:
- Language: ${language}
- Difficulty: ${difficulty}
- Target words: ${targetWords.join(', ')}
- User's mastered vocabulary: ${masteredWords.slice(0, 20).join(', ')}${masteredWords.length > 20 ? '...' : ''}
- Current complexity level: ${currentComplexity}%
- Session progression data: ${JSON.stringify(progressionData)}

Create a sentence mining exercise that:
1. Builds naturally on the user's existing vocabulary
2. Introduces target words in familiar grammatical contexts
3. Uses appropriate complexity for the user's progression level
4. Creates meaningful connections between new and known vocabulary
5. Follows natural language acquisition patterns

For ${difficulty} level:
- Beginner: 6-10 words, clear context, high-frequency supporting words
- Intermediate: 10-15 words, moderate context complexity, mixed vocabulary
- Advanced: 15+ words, subtle context, sophisticated vocabulary relationships

Requirements:
- Create ONE sentence with exactly ONE word missing (cloze exercise)
- The missing word should be one of: ${targetWords.join(', ')}
- Sentence should feel natural and contextually rich
- Use supporting vocabulary appropriate to user's progression level
- Provide helpful context clues without making it obvious

Respond with a JSON object:
{
  "sentence": "Complete sentence with target word",
  "clozeSentence": "Same sentence with [blank] replacing the target word",
  "targetWord": "the target word that was removed",
  "translation": "English translation of the complete sentence",
  "context": "Brief contextual explanation to help understanding",
  "hints": ["hint1", "hint2", "hint3"],
  "targetWordTranslation": "English meaning of the target word",
  "difficultyScore": number (1-100 based on linguistic complexity),
  "progressionNotes": "Why this exercise fits the user's learning progression"
}`;

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
            content: 'You are an expert language learning assistant that creates progressive, contextually appropriate sentence mining exercises. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    let exerciseData;

    try {
      exerciseData = JSON.parse(aiResponse.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse.choices[0].message.content);
      throw new Error('Invalid AI response format');
    }

    // Validate required fields
    if (!exerciseData.sentence || !exerciseData.clozeSentence || !exerciseData.targetWord) {
      throw new Error('AI response missing required fields');
    }

    // Store the exercise in the database
    const { data: exercise, error: exerciseError } = await supabase
      .from('sentence_mining_exercises')
      .insert({
        session_id: sessionId,
        exercise_type: exerciseType || 'cloze',
        sentence: exerciseData.sentence,
        target_words: [exerciseData.targetWord],
        unknown_words: targetWords,
        translation: exerciseData.translation,
        difficulty_score: exerciseData.difficultyScore || currentComplexity
      })
      .select()
      .single();

    if (exerciseError) {
      console.error('Error storing exercise:', exerciseError);
      throw new Error('Failed to store exercise');
    }

    // Return the enhanced exercise data
    const result = {
      id: exercise.id,
      sentence: exerciseData.sentence,
      clozeSentence: exerciseData.clozeSentence,
      targetWord: exerciseData.targetWord,
      translation: exerciseData.translation,
      context: exerciseData.context,
      hints: exerciseData.hints || [],
      targetWordTranslation: exerciseData.targetWordTranslation,
      difficulty: difficulty,
      difficultyScore: exerciseData.difficultyScore || currentComplexity,
      progressionNotes: exerciseData.progressionNotes,
      exerciseType: exerciseType || 'cloze',
      sessionId: sessionId,
      targetWords: [exerciseData.targetWord],
      unknownWords: targetWords
    };

    console.log('Generated progressive exercise:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating sentence mining exercise:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate exercise',
        details: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
