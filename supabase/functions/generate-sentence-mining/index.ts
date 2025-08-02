
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
  // Handle CORS preflight requests
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
      user_id
    } = await req.json();

    console.log(`Generating adaptive cloze exercise for user: ${user_id}, language: ${language}, difficulty: ${difficulty_level}`);

    // Step 1: Get optimal word selection using intelligent algorithms
    // Initialize variables at function scope
    let selectedWords: string[] = [];
    let selectionReasons: string[] = [];
    let reviewWords: any[] = [];
    let strugglingWords: string[] = [];
    let recentlyUsedWords: Set<string> = new Set();

    try {
      // Get words due for review from spaced repetition
      const { data: reviewWordsData, error: reviewError } = await supabase
        .from('known_words')
        .select('word')
        .eq('user_id', user_id)
        .eq('language', language)
        .lte('next_review_date', new Date().toISOString().split('T')[0])
        .order('next_review_date', { ascending: true })
        .limit(5);

      reviewWords = reviewWordsData || [];

      // Get struggling words that need reinforcement
      const { data: strugglingWordsData, error: strugglingError } = await supabase
        .from('known_words')
        .select('word, review_count, correct_count')
        .eq('user_id', user_id)
        .eq('language', language)
        .gte('review_count', 3);

      strugglingWords = strugglingWordsData?.filter(item => {
        const accuracy = item.correct_count / item.review_count;
        return accuracy < 0.6;
      }).map(item => item.word) || [];

      // Get recently used words to avoid repetition
      const { data: recentExercises, error: recentError } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words, created_at')
        .eq('session_id', session_id)
        .order('created_at', { ascending: false })
        .limit(5);

      recentlyUsedWords = new Set<string>();
      recentExercises?.forEach(exercise => {
        exercise.target_words?.forEach((word: string) => {
          recentlyUsedWords.add(word.toLowerCase());
        });
      });

      // Smart word selection logic
      const reviewWordsArray = reviewWords?.map(rw => rw.word) || [];
      
      // Prioritize struggling words, then review words, then avoid recent words
      if (strugglingWords.length > 0) {
        selectedWords = [strugglingWords[0]];
        selectionReasons.push(`Selected struggling word "${strugglingWords[0]}" for reinforcement`);
      } else if (reviewWordsArray.length > 0) {
        selectedWords = [reviewWordsArray[0]];
        selectionReasons.push(`Selected review word "${reviewWordsArray[0]}" for spaced repetition`);
      }

      console.log(`Smart word selection: ${selectedWords.length > 0 ? selectedWords[0] : 'none'}`);
      console.log(`Selection reasons:`, selectionReasons);

    } catch (selectionError) {
      console.error('Error in smart word selection:', selectionError);
      selectionReasons.push('Fallback to random selection due to selection error');
    }

    // Step 2: Build enhanced prompt with word selection context
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

    // Add intelligent word guidance if we have selected words
    if (selectedWords.length > 0) {
      prompt += `PRIORITY WORD SELECTION:
- Try to use this specific word as the target word: "${selectedWords[0]}"
- This word was selected for: ${selectionReasons.join(', ')}
- Build a natural sentence around this word
- If this word doesn't fit naturally, you may choose a different appropriate word

`;
    }

    if (n_plus_one && known_words.length > 0) {
      prompt += `N+1 Methodology: Use mostly familiar words with one new challenging word.
Known words (use as base vocabulary): ${known_words.slice(0, 30).join(', ')}

`;
    }

    // Enhanced repetition avoidance
    if (previous_sentences.length > 0) {
      prompt += `AVOID REPETITION:
- Do not repeat these previous sentences: ${previous_sentences.slice(-5).join('; ')}
- Use different sentence structures and contexts
- Avoid recently used words: ${Array.from(recentlyUsedWords).join(', ')}

`;
    }

    // Add contextual difficulty guidance
    const difficultyGuidance = {
      beginner: 'Use simple present tense, basic vocabulary, short sentences (5-8 words)',
      intermediate: 'Use varied tenses, common phrases, medium complexity (8-12 words)',
      advanced: 'Use complex structures, idiomatic expressions, longer sentences (10-15 words)'
    };

    prompt += `Difficulty-specific guidance for ${difficulty_level}:
${difficultyGuidance[difficulty_level as keyof typeof difficultyGuidance] || difficultyGuidance.intermediate}

`;

    prompt += `Return a JSON object with:
- sentence: The complete ${language} sentence
- translation: English translation 
- targetWord: The single word that should fill the blank
- clozeSentence: The sentence with the target word replaced by "___"
- difficultyScore: Number from 1-10
- context: Brief explanation of when to use this sentence
- hints: Array with one helpful hint (optional)
- wordSelectionReason: Brief explanation of why this word was chosen

Example format:
{
  "sentence": "Complete sentence in ${language}",
  "translation": "English translation",
  "targetWord": "word",
  "clozeSentence": "Sentence with ___ replacing the target word",
  "difficultyScore": 5,
  "context": "This sentence is used when...",
  "hints": ["Helpful hint about the target word"],
  "wordSelectionReason": "This word was chosen because..."
}`;

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
            content: `You are an expert language learning AI specializing in adaptive cloze exercises. You create personalized exercises that use spaced repetition principles, avoid word repetition, and adapt to individual learner needs. Always generate sentences in the target language specified by the user.` 
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
      
      // Enhanced fallback with better variety
      const fallbackSentences = {
        beginner: {
          german: ["Das ist ein schönes Haus.", "Ich trinke gerne Kaffee.", "Der Hund spielt im Park."],
          spanish: ["Esta es una casa bonita.", "Me gusta beber café.", "El perro juega en el parque."],
          french: ["C'est une belle maison.", "J'aime boire du café.", "Le chien joue dans le parc."],
          portuguese: ["Esta é uma casa bonita.", "Eu gosto de beber café.", "O cão brinca no parque."],
          italian: ["Questa è una bella casa.", "Mi piace bere il caffè.", "Il cane gioca nel parco."]
        },
        intermediate: {
          german: ["Obwohl es regnet, gehen wir spazieren.", "Nachdem ich gearbeitet habe, treffe ich Freunde."],
          spanish: ["Aunque llueve, vamos a caminar.", "Después de trabajar, me encuentro con amigos."],
          french: ["Bien qu'il pleuve, nous allons nous promener.", "Après avoir travaillé, je rencontre des amis."],
          portuguese: ["Embora chova, vamos caminhar.", "Depois de trabalhar, encontro-me com amigos."],
          italian: ["Anche se piove, andiamo a camminare.", "Dopo aver lavorato, incontro gli amici."]
        },
        advanced: {
          german: ["Trotz der schwierigen Umstände haben wir unser Ziel erreicht.", "Die Lösung des komplexen Problems erfordert innovative Ansätze."],
          spanish: ["A pesar de las circunstancias difíciles, hemos logrado nuestro objetivo.", "La solución del problema complejo requiere enfoques innovadores."],
          french: ["Malgré les circonstances difficiles, nous avons atteint notre objectif.", "La solution du problème complexe nécessite des approches innovantes."],
          portuguese: ["Apesar das circunstâncias difíceis, alcançamos nosso objetivo.", "A solução do problema complexo requer abordagens inovadoras."],
          italian: ["Nonostante le circostanze difficili, abbiamo raggiunto il nostro obiettivo.", "La soluzione del problema complesso richiede approcci innovativi."]
        }
      };

      const levelSentences = fallbackSentences[difficulty_level as keyof typeof fallbackSentences] || fallbackSentences.beginner;
      const langSentences = levelSentences[language as keyof typeof levelSentences] || levelSentences.german;
      const randomSentence = langSentences[Math.floor(Math.random() * langSentences.length)];
      
      const words = randomSentence.split(' ');
      const targetWord = words[Math.floor(words.length / 2)]; // Pick middle word
      
      exercise = {
        sentence: randomSentence,
        translation: "This is a fallback sentence.",
        targetWord,
        clozeSentence: randomSentence.replace(targetWord, "___"),
        difficultyScore: difficulty_level === 'beginner' ? 3 : difficulty_level === 'intermediate' ? 5 : 7,
        context: "This is a fallback sentence for practice.",
        hints: [`Think of a word that fits the context`],
        wordSelectionReason: "Fallback selection due to parsing error"
      };
    }

    // Step 3: Track word usage for cooldown system
    try {
      if (user_id && exercise.targetWord) {
        // Record word usage in the session for cooldown tracking
        await supabase
          .from('known_words')
          .upsert({
            user_id: user_id,
            word: exercise.targetWord,
            language: language,
            last_reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            review_count: 1,
            correct_count: 0, // Will be updated when user submits answer
            mastery_level: 1
          }, {
            onConflict: 'user_id,word,language'
          });

        console.log(`Tracked word usage: ${exercise.targetWord} for user ${user_id}`);
      }
    } catch (trackingError) {
      console.error('Error tracking word usage:', trackingError);
      // Don't fail the entire request for tracking errors
    }

    // Ensure the exercise has the correct structure for cloze with enhanced metadata
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
      wordSelectionReason: exercise.wordSelectionReason || selectionReasons.join(', ') || 'Standard selection',
      isReviewWord: reviewWords?.some(rw => rw.word === exercise.targetWord) || false,
      isStrugglingWord: strugglingWords.includes(exercise.targetWord),
      selectionQuality: selectionReasons.length > 0 ? 85 : 70
    };

    console.log('Final adaptive cloze exercise generated:', {
      targetWord: finalExercise.targetWord,
      wordSelectionReason: finalExercise.wordSelectionReason,
      isReviewWord: finalExercise.isReviewWord,
      isStrugglingWord: finalExercise.isStrugglingWord,
      selectionQuality: finalExercise.selectionQuality
    });

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
