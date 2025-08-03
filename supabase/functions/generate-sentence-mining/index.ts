
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { 
      difficulty_level, 
      language, 
      session_id,
      known_words = [],
      previous_sentences = [],
      n_plus_one = false,
      user_id,
      // Enhanced parameters
      preferred_words = [],
      novelty_words = [],
      avoid_patterns = [],
      diversity_score_target = 70,
      selection_quality = 80,
      enhanced_mode = false
    } = await req.json();

    console.log(`[Enhanced Generation] ${enhanced_mode ? 'Enhanced' : 'Standard'} generation for ${language} (${difficulty_level})`);
    console.log(`[Enhanced Generation] Preferred words: [${preferred_words.slice(0, 3).join(', ')}]`);
    console.log(`[Enhanced Generation] Novelty words: [${novelty_words.join(', ')}]`);
    console.log(`[Enhanced Generation] Avoid patterns: [${avoid_patterns.slice(0, 3).join(', ')}]`);

    // Enhanced word selection logic
    let selectedWords: string[] = [];
    let selectionReasons: string[] = [];
    let finalTargetWord = '';

    if (enhanced_mode && preferred_words.length > 0) {
      // Use intelligently selected words
      selectedWords = preferred_words;
      selectionReasons.push(`AI-selected optimal word: "${preferred_words[0]}"`);
      finalTargetWord = preferred_words[0];

      // Consider novelty injection
      if (novelty_words.length > 0 && Math.random() < 0.3) {
        finalTargetWord = novelty_words[0];
        selectionReasons.push(`Novelty word introduced: "${novelty_words[0]}"`);
      }
    } else {
      // Fallback to standard selection with pattern awareness
      try {
        const { data: reviewWordsData } = await supabase
          .from('known_words')
          .select('word')
          .eq('user_id', user_id)
          .eq('language', language)
          .lte('next_review_date', new Date().toISOString().split('T')[0])
          .order('next_review_date', { ascending: true })
          .limit(5);

        const reviewWords = reviewWordsData || [];

        if (reviewWords.length > 0) {
          finalTargetWord = reviewWords[0].word;
          selectionReasons.push(`Review word selected: "${finalTargetWord}"`);
        }
      } catch (error) {
        console.error('[Enhanced Generation] Error in fallback selection:', error);
        selectionReasons.push('Fallback to random selection due to error');
      }
    }

    // Build enhanced prompt
    let prompt = `Generate an advanced cloze (fill-in-the-blank) sentence exercise with enhanced intelligence:

Language: ${language.toUpperCase()}
Difficulty: ${difficulty_level}
Enhanced Mode: ${enhanced_mode ? 'ACTIVE' : 'INACTIVE'}
Selection Quality Target: ${selection_quality}%
Diversity Target: ${diversity_score_target}%

CORE REQUIREMENTS:
1. Create a natural, contextually rich sentence in ${language.toUpperCase()}
2. Choose ONE target word for the blank (cloze exercise)
3. Target word must be contextually perfect and educationally valuable
4. Provide accurate English translation
5. Create cloze sentence by replacing target word with "___"
6. Focus on real-world, practical usage
7. Ensure sentence flows naturally and is memorable

`;

    // Enhanced word guidance
    if (finalTargetWord) {
      prompt += `PRIORITY TARGET WORD:
- PRIMARY FOCUS: Use "${finalTargetWord}" as the target word
- CONTEXT: Build a natural, engaging sentence around this specific word
- RATIONALE: ${selectionReasons.join('; ')}
- If this word cannot be used naturally, choose the most appropriate alternative from the same semantic domain

`;
    }

    if (novelty_words.length > 0) {
      prompt += `NOVELTY ENHANCEMENT:
- Consider these advanced vocabulary words: ${novelty_words.join(', ')}
- Only use if they fit naturally and enhance learning value
- Balance challenge with comprehensibility

`;
    }

    // Pattern diversity requirements
    if (avoid_patterns.length > 0 || enhanced_mode) {
      prompt += `PATTERN DIVERSITY REQUIREMENTS:
- AVOID these overused sentence patterns: ${avoid_patterns.slice(0, 3).join(', ')}
- Use varied sentence structures (simple, compound, complex)
- Diversify grammatical patterns and word order
- Target diversity score: ${diversity_score_target}%
- Employ different contexts: home, work, social, travel, culture

`;
    }

    // N+1 methodology enhancement
    if (n_plus_one && known_words.length > 0) {
      prompt += `ENHANCED N+1 METHODOLOGY:
- Base vocabulary (familiar): ${known_words.slice(0, 20).join(', ')}
- Introduce 1 appropriately challenging element
- Balance familiarity with learning progression
- Ensure cognitive load is optimal for retention

`;
    }

    // Advanced repetition avoidance
    if (previous_sentences.length > 0) {
      prompt += `ADVANCED REPETITION AVOIDANCE:
- STRICTLY AVOID repeating: ${previous_sentences.slice(-3).join(' | ')}
- Use completely different vocabulary and contexts
- Vary sentence length: aim for ${difficulty_level === 'beginner' ? '6-9' : difficulty_level === 'intermediate' ? '9-13' : '12-18'} words
- Employ different discourse patterns

`;
    }

    // Difficulty-specific enhanced guidance
    const enhancedGuidance = {
      beginner: 'Simple present/past tense, concrete nouns, basic adjectives, everyday situations, clear subject-verb-object patterns',
      intermediate: 'Mixed tenses, abstract concepts, conjunctions, complex sentences, cultural contexts, idiomatic elements',
      advanced: 'Sophisticated structures, nuanced meanings, advanced vocabulary, cultural subtleties, complex discourse patterns'
    };

    prompt += `DIFFICULTY-SPECIFIC ENHANCEMENT (${difficulty_level}):
${enhancedGuidance[difficulty_level as keyof typeof enhancedGuidance]}

`;

    prompt += `OUTPUT FORMAT (JSON):
{
  "sentence": "Complete natural sentence in ${language}",
  "translation": "Accurate English translation",
  "targetWord": "single target word for blank",
  "clozeSentence": "Sentence with ___ replacing target word",
  "difficultyScore": [1-10 integer],
  "context": "When/why this sentence is used",
  "hints": ["One contextual hint"],
  "wordSelectionReason": "Why this target word was chosen",
  "enhancedFeatures": {
    "patternComplexity": "Description of sentence pattern used",
    "contextualRichness": "Description of contextual elements",
    "learningValue": "Educational benefit explanation"
  }
}

Focus on creating an exceptional learning experience that balances challenge, engagement, and educational value.`;

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
            content: `You are an advanced AI language learning specialist with expertise in adaptive content generation, spaced repetition, and personalized learning paths. You create exceptional cloze exercises that maximize learning effectiveness while maintaining engagement and appropriate challenge levels. Your exercises are powered by advanced algorithms that ensure optimal word selection, pattern diversity, and learning progression.` 
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
    console.log('[Enhanced Generation] OpenAI response received');

    // Parse the JSON response
    let exercise;
    try {
      const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      exercise = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[Enhanced Generation] Failed to parse response:', parseError);
      
      // Enhanced fallback with better variety
      const enhancedFallbacks = {
        beginner: {
          german: {
            sentences: ["Ich lese jeden ___ ein interessantes Buch.", "Der ___ schmeckt heute besonders gut.", "Meine ___ kommt morgen zu Besuch."],
            words: ["Tag", "Kaffee", "Freundin"],
            translations: ["I read an interesting book every day.", "The coffee tastes especially good today.", "My friend is coming to visit tomorrow."]
          },
          spanish: {
            sentences: ["Me gusta ___ música en las tardes.", "El ___ está muy caliente hoy.", "Vamos al ___ este fin de semana."],
            words: ["escuchar", "sol", "parque"],
            translations: ["I like to listen to music in the evenings.", "The sun is very hot today.", "We're going to the park this weekend."]
          }
        },
        intermediate: {
          german: {
            sentences: ["Obwohl es regnet, ___ wir spazieren gehen.", "Die ___ war sehr interessant und lehrreich.", "Nachdem ich ___ hatte, fühlte ich mich besser."],
            words: ["werden", "Veranstaltung", "gegessen"],
            translations: ["Although it's raining, we will go for a walk.", "The event was very interesting and educational.", "After I had eaten, I felt better."]
          }
        }
      };

      const levelFallbacks = enhancedFallbacks[difficulty_level as keyof typeof enhancedFallbacks];
      const langFallbacks = levelFallbacks?.[language as keyof typeof levelFallbacks] || levelFallbacks?.german;
      
      if (langFallbacks) {
        const randomIndex = Math.floor(Math.random() * langFallbacks.sentences.length);
        exercise = {
          sentence: langFallbacks.sentences[randomIndex].replace('___', langFallbacks.words[randomIndex]),
          translation: langFallbacks.translations[randomIndex],
          targetWord: langFallbacks.words[randomIndex],
          clozeSentence: langFallbacks.sentences[randomIndex],
          difficultyScore: difficulty_level === 'beginner' ? 3 : difficulty_level === 'intermediate' ? 5 : 7,
          context: "Enhanced fallback sentence for practice.",
          hints: [`Think of a word that makes sense in this context`],
          wordSelectionReason: "Enhanced fallback due to parsing error",
          enhancedFeatures: {
            patternComplexity: "Standard pattern",
            contextualRichness: "Basic context",
            learningValue: "Vocabulary practice"
          }
        };
      }
    }

    // Track enhanced word usage for cooldown
    try {
      if (user_id && exercise.targetWord) {
        await supabase
          .from('known_words')
          .upsert({
            user_id: user_id,
            word: exercise.targetWord,
            language: language,
            last_reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            review_count: 1,
            correct_count: 0,
            mastery_level: 1
          }, {
            onConflict: 'user_id,word,language'
          });

        console.log(`[Enhanced Generation] Tracked enhanced word usage: ${exercise.targetWord}`);
      }
    } catch (trackingError) {
      console.error('[Enhanced Generation] Error tracking word usage:', trackingError);
    }

    // Create final enhanced exercise
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
      id: crypto.randomUUID(),
      // Enhanced metadata
      wordSelectionReason: exercise.wordSelectionReason || selectionReasons.join(', ') || 'Enhanced selection',
      isReviewWord: selectedWords.length > 0,
      isNoveltyWord: novelty_words.includes(exercise.targetWord),
      selectionQuality: selection_quality,
      diversityScore: diversity_score_target,
      enhancedFeatures: exercise.enhancedFeatures || {
        patternComplexity: "Standard",
        contextualRichness: "Basic",
        learningValue: "Vocabulary"
      }
    };

    console.log(`[Enhanced Generation] Final exercise created:`, {
      targetWord: finalExercise.targetWord,
      selectionQuality: finalExercise.selectionQuality,
      diversityScore: finalExercise.diversityScore,
      enhancedMode: enhanced_mode
    });

    return new Response(JSON.stringify(finalExercise), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Enhanced Generation] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
