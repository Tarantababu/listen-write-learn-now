
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Enhanced Generation] Starting Enhanced generation with spaced repetition support');
    
    const {
      difficulty_level,
      language,
      session_id,
      user_id,
      preferred_words = [],
      enhanced_mode = false,
      spaced_repetition_mode = false,
      target_word_override,
      language_consistency_check = false
    } = await req.json();

    console.log(`[Enhanced Generation] Language: ${language}, Difficulty: ${difficulty_level}, Spaced Repetition: ${spaced_repetition_mode}`);
    console.log(`[Enhanced Generation] Preferred words: [${preferred_words.join(', ')}]`);
    console.log(`[Enhanced Generation] Target word override: ${target_word_override}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get recent word usage for diversity
    const { data: recentExercises } = await supabase
      .from('sentence_mining_exercises')
      .select('target_words')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentWords = new Set<string>();
    recentExercises?.forEach(exercise => {
      exercise.target_words?.forEach((word: string) => {
        recentWords.add(word.toLowerCase());
      });
    });

    console.log(`[Enhanced Generation] Recent usage analysis: ${recentWords.size} unique words tracked`);

    // Language-specific word selection with spaced repetition priority
    let finalTargetWord = target_word_override;
    let selectionReason = 'Spaced repetition selection';

    if (!finalTargetWord && preferred_words.length > 0) {
      // Use preferred word from spaced repetition system
      finalTargetWord = preferred_words[0];
      selectionReason = 'Spaced repetition priority word';
    }

    // Language consistency fallbacks
    const languageFallbacks: Record<string, string[]> = {
      german: ['der', 'die', 'das', 'und', 'ist', 'haben', 'sein', 'können'],
      spanish: ['el', 'la', 'de', 'que', 'y', 'ser', 'estar', 'tener'],
      french: ['le', 'de', 'et', 'être', 'avoir', 'que', 'pour', 'dans'],
      italian: ['il', 'di', 'che', 'essere', 'avere', 'fare', 'dire', 'andare'],
      portuguese: ['o', 'de', 'que', 'ser', 'ter', 'fazer', 'dizer', 'ir'],
      english: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that']
    };

    if (!finalTargetWord) {
      const fallbacks = languageFallbacks[language.toLowerCase()] || languageFallbacks.english;
      finalTargetWord = fallbacks[Math.floor(Math.random() * Math.min(fallbacks.length, 5))];
      selectionReason = `Language-appropriate fallback for ${language}`;
    }

    console.log(`[Enhanced Generation] Using target word: "${finalTargetWord}" - ${selectionReason}`);

    // Enhanced prompt for AI generation
    const systemPrompt = `You are an expert language teacher creating cloze exercises for ${language} learners at ${difficulty_level} level.

CRITICAL REQUIREMENTS:
1. The target word MUST be "${finalTargetWord}" and MUST be in ${language}
2. Create a natural sentence in ${language} where "${finalTargetWord}" fits perfectly
3. The sentence should be appropriate for ${difficulty_level} learners
4. Provide the English translation of the sentence
5. The target word meaning should be in English

${spaced_repetition_mode ? 'SPACED REPETITION MODE: This word was selected based on the learner\'s progress and optimal review timing.' : ''}

Language-specific guidelines for ${language}:
${language === 'german' ? '- Use appropriate articles (der/die/das), proper word order, and consider cases' : ''}
${language === 'spanish' ? '- Use proper gender agreement, verb conjugations, and natural word order' : ''}
${language === 'french' ? '- Include proper articles, gender agreement, and natural French syntax' : ''}

Format your response as JSON:
{
  "sentence": "Complete sentence in ${language}",
  "clozeSentence": "Sentence with _____ replacing the target word",
  "correctAnswer": "${finalTargetWord}",
  "targetWord": "${finalTargetWord}",
  "translation": "English translation of the complete sentence",
  "targetWordTranslation": "English meaning of the target word",
  "difficulty": "${difficulty_level}",
  "context": "Brief context about when to use this word"
}`;

    const userPrompt = `Create a cloze exercise for the ${language} word "${finalTargetWord}" at ${difficulty_level} level. 
    ${spaced_repetition_mode ? 'This is part of a spaced repetition learning session.' : ''}
    The sentence should be natural and educationally valuable.`;

    console.log('[Enhanced Generation] Sending request to OpenAI...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    console.log('[Enhanced Generation] OpenAI response received');
    const openAIData = await openAIResponse.json();
    
    let exerciseData;
    try {
      const content = openAIData.choices[0].message.content.trim();
      // Remove markdown code blocks if present
      const jsonContent = content.replace(/```json\n?|\n?```/g, '');
      exerciseData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('[Enhanced Generation] JSON parse error:', parseError);
      throw new Error('Failed to parse AI response');
    }

    // Language consistency verification
    if (language_consistency_check && exerciseData.targetWord) {
      const isConsistent = exerciseData.targetWord.toLowerCase() === finalTargetWord.toLowerCase();
      if (!isConsistent) {
        console.warn(`[Enhanced Generation] Language consistency issue: expected "${finalTargetWord}", got "${exerciseData.targetWord}"`);
        // Force correction
        exerciseData.targetWord = finalTargetWord;
        exerciseData.correctAnswer = finalTargetWord;
      }
    }

    // Enhanced exercise object
    const exercise = {
      id: crypto.randomUUID(),
      sentence: exerciseData.sentence,
      targetWord: exerciseData.targetWord || finalTargetWord,
      clozeSentence: exerciseData.clozeSentence,
      difficulty: difficulty_level,
      context: exerciseData.context || `Learning ${language} vocabulary`,
      createdAt: new Date(),
      attempts: 0,
      correctAnswer: exerciseData.correctAnswer || finalTargetWord,
      translation: exerciseData.translation,
      targetWordTranslation: exerciseData.targetWordTranslation,
      hints: [exerciseData.targetWordTranslation].filter(Boolean),
      session_id: session_id,
      difficultyScore: difficulty_level === 'beginner' ? 1 : difficulty_level === 'intermediate' ? 2 : 3,
      isCorrect: null,
      userAnswer: '',
      exerciseType: 'cloze' as const,
      language: language
    };

    // Track word usage in database for spaced repetition
    if (spaced_repetition_mode && exercise.targetWord) {
      try {
        await supabase
          .from('known_words')
          .upsert({
            user_id: user_id,
            word: exercise.targetWord,
            language: language,
            review_count: 0,
            correct_count: 0,
            mastery_level: 1,
            last_reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,word,language',
            ignoreDuplicates: false
          });

        console.log(`[Enhanced Generation] Tracked word usage: ${exercise.targetWord} for language: ${language}`);
      } catch (error) {
        console.error('[Enhanced Generation] Error tracking word usage:', error);
      }
    }

    console.log(`[Enhanced Generation] Final word: ${exercise.targetWord}, Selection: ${selectionReason}`);
    console.log(`[Enhanced Generation] Exercise created successfully in ${Date.now() - startTime}ms`);

    return new Response(JSON.stringify(exercise), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Enhanced Generation] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Enhanced sentence mining generation failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Track start time for performance monitoring
const startTime = Date.now();
