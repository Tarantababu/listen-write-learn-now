
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

interface ExerciseResponse {
  sentence: string;
  translation: string;
  targetWord: string;
  targetWordTranslation: string;
  clozeSentence: string;
  difficultyScore: number;
  context: string;
  hints: string[];
  wordSelectionReason?: string;
  enhancedFeatures?: {
    patternComplexity: string;
    contextualRichness: string;
    learningValue: string;
  };
}

interface FallbackExercise {
  sentences: string[];
  words: string[];
  translations: string[];
  wordTranslations: string[];
}

// Comprehensive fallback system for all supported languages
const COMPREHENSIVE_FALLBACKS = {
  beginner: {
    german: {
      sentences: [
        "Ich trinke jeden ___ Kaffee.", 
        "Der ___ ist heute sehr schön.", 
        "Meine ___ kocht das Abendessen.",
        "Das ___ ist rot und groß.",
        "Wir gehen zum ___ spazieren.",
        "Die ___ singt ein schönes Lied.",
        "Er liest ein interessantes ___.",
        "Sie kauft frisches ___ im Laden."
      ],
      words: ["Morgen", "Tag", "Mutter", "Haus", "Park", "Katze", "Buch", "Brot"],
      translations: [
        "I drink coffee every morning.", 
        "The day is very beautiful today.", 
        "My mother cooks dinner.",
        "The house is red and big.",
        "We go for a walk to the park.",
        "The cat sings a beautiful song.",
        "He reads an interesting book.",
        "She buys fresh bread in the store."
      ],
      wordTranslations: ["morning", "day", "mother", "house", "park", "cat", "book", "bread"]
    },
    spanish: {
      sentences: [
        "Me gusta ___ en el parque.", 
        "El ___ brilla mucho hoy.", 
        "Vamos a ___ pizza esta noche.",
        "La ___ está muy dulce.",
        "Él estudia ___ todos los días.",
        "Ella compra ___ en el mercado.",
        "Nosotros vemos una ___ interesante.",
        "Tú tienes un ___ muy bonito."
      ],
      words: ["caminar", "sol", "comer", "fruta", "español", "verduras", "película", "jardín"],
      translations: [
        "I like to walk in the park.", 
        "The sun shines a lot today.", 
        "We are going to eat pizza tonight.",
        "The fruit is very sweet.",
        "He studies Spanish every day.",
        "She buys vegetables at the market.",
        "We watch an interesting movie.",
        "You have a very beautiful garden."
      ],
      wordTranslations: ["to walk", "sun", "to eat", "fruit", "Spanish", "vegetables", "movie", "garden"]
    },
    french: {
      sentences: [
        "Je mange du ___ au petit-déjeuner.", 
        "Le ___ est fermé le dimanche.", 
        "Elle ___ de la musique classique.",
        "Nous visitons un ___ historique.",
        "Tu parles ___ très bien.",
        "Il achète des ___ colorées.",
        "Vous habitez dans une ___ maison.",
        "Ils préparent un délicieux ___."
      ],
      words: ["pain", "magasin", "écoute", "château", "français", "fleurs", "grande", "gâteau"],
      translations: [
        "I eat bread for breakfast.", 
        "The store is closed on Sunday.", 
        "She listens to classical music.",
        "We visit a historic castle.",
        "You speak French very well.",
        "He buys colorful flowers.",
        "You live in a big house.",
        "They prepare a delicious cake."
      ],
      wordTranslations: ["bread", "store", "listens", "castle", "French", "flowers", "big", "cake"]
    },
    italian: {
      sentences: [
        "Io ___ la pasta ogni giorno.",
        "Il ___ è molto bello oggi.",
        "La ___ prepara la cena.",
        "Noi andiamo al ___ insieme.",
        "Tu hai un ___ simpatico.",
        "Lei compra il ___ fresco.",
        "Voi leggete un ___ interessante.",
        "Loro guardano la ___."
      ],
      words: ["mangio", "tempo", "mamma", "cinema", "cane", "pane", "libro", "televisione"],
      translations: [
        "I eat pasta every day.",
        "The weather is very beautiful today.",
        "Mom prepares dinner.",
        "We go to the cinema together.",
        "You have a nice dog.",
        "She buys fresh bread.",
        "You read an interesting book.",
        "They watch television."
      ],
      wordTranslations: ["eat", "weather", "mom", "cinema", "dog", "bread", "book", "television"]
    },
    portuguese: {
      sentences: [
        "Eu ___ café todas as manhãs.",
        "O ___ está muito bonito hoje.",
        "A ___ cozinha o jantar.",
        "Nós vamos ao ___ no fim de semana.",
        "Você tem um ___ muito legal.",
        "Ela compra ___ no mercado.",
        "Vocês leem um ___ interessante.",
        "Eles assistem ___."
      ],
      words: ["bebo", "tempo", "família", "parque", "carro", "frutas", "livro", "televisão"],
      translations: [
        "I drink coffee every morning.",
        "The weather is very beautiful today.",
        "The family cooks dinner.",
        "We go to the park on weekends.",
        "You have a very cool car.",
        "She buys fruits at the market.",
        "You read an interesting book.",
        "They watch television."
      ],
      wordTranslations: ["drink", "weather", "family", "park", "car", "fruits", "book", "television"]
    },
    dutch: {
      sentences: [
        "Ik drink elke ___ koffie.",
        "Het ___ is vandaag heel mooi.",
        "Mijn ___ kookt het avondeten.",
        "We gaan naar het ___ wandelen.",
        "Jij hebt een leuke ___.",
        "Zij koopt vers ___ in de winkel.",
        "Jullie lezen een interessant ___.",
        "Zij kijken naar de ___."
      ],
      words: ["ochtend", "weer", "moeder", "park", "hond", "brood", "boek", "televisie"],
      translations: [
        "I drink coffee every morning.",
        "The weather is very beautiful today.",
        "My mother cooks dinner.",
        "We go for a walk to the park.",
        "You have a nice dog.",
        "She buys fresh bread in the store.",
        "You read an interesting book.",
        "They watch television."
      ],
      wordTranslations: ["morning", "weather", "mother", "park", "dog", "bread", "book", "television"]
    },
    norwegian: {
      sentences: [
        "Jeg drikker ___ hver morgen.",
        "Været er meget ___ i dag.",
        "Min ___ lager middag.",
        "Vi går til ___ og spaserer.",
        "Du har en fin ___.",
        "Hun kjøper friskt ___ i butikken.",
        "Dere leser en interessant ___.",
        "De ser på ___."
      ],
      words: ["kaffe", "pent", "mor", "parken", "hund", "brød", "bok", "TV"],
      translations: [
        "I drink coffee every morning.",
        "The weather is very beautiful today.",
        "My mother makes dinner.",
        "We go to the park and walk.",
        "You have a nice dog.",
        "She buys fresh bread in the store.",
        "You read an interesting book.",
        "They watch TV."
      ],
      wordTranslations: ["coffee", "nice", "mother", "park", "dog", "bread", "book", "TV"]
    },
    swedish: {
      sentences: [
        "Jag dricker ___ varje morgon.",
        "Vädret är mycket ___ idag.",
        "Min ___ lagar middag.",
        "Vi går till ___ och promenerar.",
        "Du har en fin ___.",
        "Hon köper färskt ___ i affären.",
        "Ni läser en intressant ___.",
        "De tittar på ___."
      ],
      words: ["kaffe", "vackert", "mamma", "parken", "hund", "bröd", "bok", "TV"],
      translations: [
        "I drink coffee every morning.",
        "The weather is very beautiful today.",
        "My mother cooks dinner.",
        "We go to the park and walk.",
        "You have a nice dog.",
        "She buys fresh bread in the store.",
        "You read an interesting book.",
        "They watch TV."
      ],
      wordTranslations: ["coffee", "beautiful", "mother", "park", "dog", "bread", "book", "TV"]
    }
  },
  intermediate: {
    german: {
      sentences: [
        "Obwohl es regnet, ___ wir trotzdem spazieren.", 
        "Die Veranstaltung war sehr ___ und informativ.", 
        "Nachdem ich ___ hatte, fühlte ich mich besser.",
        "Während der Ferien ___ wir viele Museen.",
        "Er ___ sich über das schöne Wetter.",
        "Die ___ des Problems war nicht einfach.",
        "Wir müssen noch viele ___ erledigen.",
        "Sie hat eine wichtige ___ getroffen."
      ],
      words: ["gehen", "interessant", "gegessen", "besuchten", "freut", "Lösung", "Aufgaben", "Entscheidung"],
      translations: [
        "Although it's raining, we go for a walk anyway.", 
        "The event was very interesting and informative.", 
        "After I had eaten, I felt better.",
        "During the holidays we visited many museums.",
        "He is happy about the beautiful weather.",
        "The solution to the problem was not easy.",
        "We still have to complete many tasks.",
        "She made an important decision."
      ],
      wordTranslations: ["go", "interesting", "eaten", "visited", "is happy", "solution", "tasks", "decision"]
    },
    spanish: {
      sentences: [
        "Aunque llueve, nosotros ___ al parque.",
        "El evento fue muy ___ e informativo.",
        "Después de que ___, me sentí mejor.",
        "Durante las vacaciones ___ muchos museos.",
        "Él se ___ por el buen tiempo.",
        "La ___ del problema no fue fácil.",
        "Tenemos que ___ muchas tareas todavía.",
        "Ella tomó una ___ importante."
      ],
      words: ["vamos", "interesante", "comí", "visitamos", "alegra", "solución", "completar", "decisión"],
      translations: [
        "Although it rains, we go to the park.",
        "The event was very interesting and informative.",
        "After I ate, I felt better.",
        "During the holidays we visited many museums.",
        "He is happy about the good weather.",
        "The solution to the problem was not easy.",
        "We still have to complete many tasks.",
        "She made an important decision."
      ],
      wordTranslations: ["go", "interesting", "ate", "visited", "is happy", "solution", "complete", "decision"]
    },
    french: {
      sentences: [
        "Bien qu'il pleuve, nous ___ au parc.",
        "L'événement était très ___ et informatif.",
        "Après avoir ___, je me suis senti mieux.",
        "Pendant les vacances, nous avons ___ de nombreux musées.",
        "Il se ___ du beau temps.",
        "La ___ du problème n'était pas facile.",
        "Nous devons encore ___ beaucoup de tâches.",
        "Elle a pris une ___ importante."
      ],
      words: ["allons", "intéressant", "mangé", "visité", "réjouit", "solution", "accomplir", "décision"],
      translations: [
        "Although it rains, we go to the park.",
        "The event was very interesting and informative.",
        "After eating, I felt better.",
        "During the holidays, we visited many museums.",
        "He is happy about the beautiful weather.",
        "The solution to the problem was not easy.",
        "We still have to accomplish many tasks.",
        "She made an important decision."
      ],
      wordTranslations: ["go", "interesting", "eaten", "visited", "rejoices", "solution", "accomplish", "decision"]
    }
  },
  advanced: {
    german: {
      sentences: [
        "Die wirtschaftliche ___ hat sich deutlich verbessert.", 
        "Trotz der ___ konnten wir das Projekt abschließen.", 
        "Die wissenschaftlichen ___ sind beeindruckend.",
        "Seine ___ zur aktuellen Situation war aufschlussreich.",
        "Die ___ zwischen den beiden Ländern ist kompliziert.",
        "Wir müssen die ___ der Maßnahme analysieren.",
        "Die ___ des Unternehmens ist vielversprechend.",
        "Ihre ___ Fähigkeiten sind bemerkenswert."
      ],
      words: ["Lage", "Hindernisse", "Erkenntnisse", "Analyse", "Beziehung", "Auswirkungen", "Entwicklung", "analytischen"],
      translations: [
        "The economic situation has improved significantly.", 
        "Despite the obstacles, we could complete the project.", 
        "The scientific findings are impressive.",
        "His analysis of the current situation was insightful.",
        "The relationship between the two countries is complicated.",
        "We need to analyze the effects of the measure.",
        "The development of the company is promising.",
        "Her analytical skills are remarkable."
      ],
      wordTranslations: ["situation", "obstacles", "findings", "analysis", "relationship", "effects", "development", "analytical"]
    },
    spanish: {
      sentences: [
        "La situación ___ ha mejorado significativamente.",
        "A pesar de los ___, pudimos completar el proyecto.",
        "Los ___ científicos son impresionantes.",
        "Su ___ de la situación actual fue revelador.",
        "La ___ entre los dos países es complicada.",
        "Debemos analizar los ___ de la medida.",
        "El ___ de la empresa es prometedor.",
        "Sus habilidades ___ son notables."
      ],
      words: ["económica", "obstáculos", "hallazgos", "análisis", "relación", "efectos", "desarrollo", "analíticas"],
      translations: [
        "The economic situation has improved significantly.",
        "Despite the obstacles, we could complete the project.",
        "The scientific findings are impressive.",
        "His analysis of the current situation was revealing.",
        "The relationship between the two countries is complicated.",
        "We must analyze the effects of the measure.",
        "The development of the company is promising.",
        "Her analytical skills are remarkable."
      ],
      wordTranslations: ["economic", "obstacles", "findings", "analysis", "relationship", "effects", "development", "analytical"]
    },
    french: {
      sentences: [
        "La situation ___ s'est nettement améliorée.",
        "Malgré les ___, nous avons pu terminer le projet.",
        "Les ___ scientifiques sont impressionnantes.",
        "Son ___ de la situation actuelle était révélateur.",
        "La ___ entre les deux pays est compliquée.",
        "Nous devons analyser les ___ de la mesure.",
        "Le ___ de l'entreprise est prometteur.",
        "Ses compétences ___ sont remarquables."
      ],
      words: ["économique", "obstacles", "découvertes", "analyse", "relation", "effets", "développement", "analytiques"],
      translations: [
        "The economic situation has improved significantly.",
        "Despite the obstacles, we could complete the project.",
        "The scientific discoveries are impressive.",
        "His analysis of the current situation was revealing.",
        "The relationship between the two countries is complicated.",
        "We must analyze the effects of the measure.",
        "The development of the company is promising.",
        "Her analytical skills are remarkable."
      ],
      wordTranslations: ["economic", "obstacles", "discoveries", "analysis", "relationship", "effects", "development", "analytical"]
    }
  }
};

// Enhanced JSON parsing with multiple recovery strategies
function parseOpenAIResponse(content: string): ExerciseResponse | null {
  if (!content) {
    console.error('[Enhanced Generation] Empty content received');
    return null;
  }

  // Strategy 1: Direct JSON parse
  try {
    const parsed = JSON.parse(content);
    if (validateExerciseStructure(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.log('[Enhanced Generation] Direct JSON parse failed, trying cleanup');
  }

  // Strategy 2: Clean and parse JSON
  try {
    const cleanContent = content
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .replace(/^\s*[\r\n]/gm, '')
      .trim();
    
    const parsed = JSON.parse(cleanContent);
    if (validateExerciseStructure(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.log('[Enhanced Generation] Cleaned JSON parse failed, trying extraction');
  }

  // Strategy 3: Extract JSON from text
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (validateExerciseStructure(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.log('[Enhanced Generation] JSON extraction failed, trying repair');
  }

  // Strategy 4: Attempt to repair common JSON issues
  try {
    let repairedContent = content
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .replace(/,\s*}/g, '}')        // Remove trailing commas
      .replace(/,\s*]/g, ']')        // Remove trailing commas in arrays
      .replace(/'/g, '"')            // Replace single quotes
      .replace(/(\w+):/g, '"$1":')   // Quote unquoted keys
      .trim();

    const parsed = JSON.parse(repairedContent);
    if (validateExerciseStructure(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('[Enhanced Generation] All JSON parsing strategies failed:', e);
  }

  return null;
}

function validateExerciseStructure(obj: any): boolean {
  return obj && 
         typeof obj.sentence === 'string' && 
         typeof obj.targetWord === 'string' &&
         typeof obj.translation === 'string' &&
         obj.sentence.length > 0 &&
         obj.targetWord.length > 0;
}

function createLanguageAwareFallback(language: string, difficultyLevel: string, previousSentences: string[] = []): ExerciseResponse {
  console.log(`[Language-Aware Fallback] Creating fallback for language: ${language}, difficulty: ${difficultyLevel}`);
  
  const level = difficultyLevel || 'beginner';
  const normalizedLanguage = language.toLowerCase();
  
  // Try to get fallbacks for the specific language and difficulty
  let fallbacks = COMPREHENSIVE_FALLBACKS[level as keyof typeof COMPREHENSIVE_FALLBACKS]?.[normalizedLanguage as keyof typeof COMPREHENSIVE_FALLBACKS['beginner']];
  
  // If not found, try beginner level for the language
  if (!fallbacks && level !== 'beginner') {
    console.log(`[Language-Aware Fallback] No ${level} fallbacks for ${normalizedLanguage}, trying beginner`);
    fallbacks = COMPREHENSIVE_FALLBACKS.beginner[normalizedLanguage as keyof typeof COMPREHENSIVE_FALLBACKS['beginner']];
  }
  
  // If still not found, generate a basic fallback
  if (!fallbacks) {
    console.log(`[Language-Aware Fallback] No fallbacks found for ${normalizedLanguage}, generating basic fallback`);
    return generateBasicLanguageFallback(normalizedLanguage, level);
  }
  
  // Find unused sentences by checking against previous ones
  const availableIndices = fallbacks.sentences
    .map((_, index) => index)
    .filter(index => {
      const sentence = fallbacks!.sentences[index].replace('___', fallbacks!.words[index]);
      return !previousSentences.some(prev => 
        prev.toLowerCase().includes(sentence.toLowerCase().substring(0, 20))
      );
    });

  // If all sentences used, reset to random selection
  const selectedIndex = availableIndices.length > 0 
    ? availableIndices[Math.floor(Math.random() * availableIndices.length)]
    : Math.floor(Math.random() * fallbacks.sentences.length);

  const sentence = fallbacks.sentences[selectedIndex].replace('___', fallbacks.words[selectedIndex]);
  
  return {
    sentence,
    translation: fallbacks.translations[selectedIndex],
    targetWord: fallbacks.words[selectedIndex],
    targetWordTranslation: fallbacks.wordTranslations[selectedIndex],
    clozeSentence: fallbacks.sentences[selectedIndex],
    difficultyScore: level === 'beginner' ? 3 : level === 'intermediate' ? 5 : 7,
    context: `Language-aware fallback exercise for ${language} (${level})`,
    hints: [fallbacks.wordTranslations[selectedIndex]],
    wordSelectionReason: `Language-aware fallback with variety optimization for ${language}`,
    enhancedFeatures: {
      patternComplexity: 'Standard structure with contextual clues',
      contextualRichness: 'Everyday situation with clear meaning',
      learningValue: 'Essential vocabulary practice'
    }
  };
}

function generateBasicLanguageFallback(language: string, difficulty: string): ExerciseResponse {
  console.log(`[Basic Language Fallback] Generating for ${language} at ${difficulty} level`);
  
  // Generate a simple, language-appropriate fallback
  const basicSentences = {
    english: {
      sentence: "I drink coffee every morning.",
      targetWord: "coffee",
      clozeSentence: "I drink ___ every morning.",
      translation: "I drink coffee every morning.",
      targetWordTranslation: "coffee",
      context: "Daily routine"
    },
    default: {
      sentence: "This is a practice sentence.",
      targetWord: "practice",
      clozeSentence: "This is a ___ sentence.",
      translation: "This is a practice sentence.",
      targetWordTranslation: "practice",
      context: "Language learning exercise"
    }
  };
  
  const fallback = basicSentences[language as keyof typeof basicSentences] || basicSentences.default;
  
  return {
    sentence: fallback.sentence,
    translation: fallback.translation,
    targetWord: fallback.targetWord,
    targetWordTranslation: fallback.targetWordTranslation,
    clozeSentence: fallback.clozeSentence,
    difficultyScore: difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 5 : 7,
    context: fallback.context,
    hints: [fallback.targetWordTranslation],
    wordSelectionReason: `Basic language fallback for ${language}`,
    enhancedFeatures: {
      patternComplexity: 'Simple structure',
      contextualRichness: 'Basic context',
      learningValue: 'Fundamental vocabulary'
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
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
      preferred_words = [],
      novelty_words = [],
      avoid_patterns = [],
      diversity_score_target = 70,
      selection_quality = 80,
      enhanced_mode = false
    } = await req.json();

    // Enhanced logging for debugging
    console.log(`[Enhanced Generation] Starting ${enhanced_mode ? 'Enhanced' : 'Standard'} generation`);
    console.log(`[Enhanced Generation] Language: ${language}, Difficulty: ${difficulty_level}`);
    console.log(`[Enhanced Generation] Previous sentences count: ${previous_sentences.length}`);

    // Validate required parameters with better error messages
    if (!difficulty_level || !language || !user_id) {
      console.error('[Enhanced Generation] Missing required parameters:', { 
        difficulty_level: !!difficulty_level, 
        language: !!language, 
        user_id: !!user_id 
      });
      throw new Error('Missing required parameters: difficulty_level, language, or user_id');
    }

    // Validate language parameter
    if (typeof language !== 'string' || language.trim().length === 0) {
      console.error('[Enhanced Generation] Invalid language parameter:', language);
      throw new Error('Invalid language parameter provided');
    }

    // Enhanced word selection with fallback
    let selectedWords: string[] = [];
    let selectionReasons: string[] = [];
    let finalTargetWord = '';

    if (enhanced_mode && preferred_words.length > 0) {
      selectedWords = preferred_words;
      selectionReasons.push(`Enhanced word selection: "${preferred_words[0]}"`);
      finalTargetWord = preferred_words[0];

      if (novelty_words.length > 0 && Math.random() < 0.3) {
        finalTargetWord = novelty_words[0];
        selectionReasons.push(`Novelty injection: "${novelty_words[0]}"`);
      }
    } else {
      // Improved fallback selection with database resilience
      try {
        const { data: reviewWordsData, error } = await supabase
          .from('known_words')
          .select('word')
          .eq('user_id', user_id)
          .eq('language', language)
          .lte('next_review_date', new Date().toISOString().split('T')[0])
          .order('next_review_date', { ascending: true })
          .limit(5);

        if (error) {
          console.warn('[Enhanced Generation] Database query failed:', error);
          selectionReasons.push('Database unavailable, using adaptive selection');
        } else if (reviewWordsData && reviewWordsData.length > 0) {
          finalTargetWord = reviewWordsData[0].word;
          selectionReasons.push(`Review word selected: "${finalTargetWord}"`);
        }
      } catch (dbError) {
        console.error('[Enhanced Generation] Database error:', dbError);
        selectionReasons.push('Database error, using random selection');
      }
    }

    // Build optimized prompt with performance improvements
    const prompt = buildOptimizedPrompt({
      language,
      difficultyLevel: difficulty_level,
      enhanced_mode,
      selection_quality,
      diversity_score_target,
      finalTargetWord,
      selectionReasons,
      novelty_words,
      avoid_patterns,
      n_plus_one,
      known_words,
      previous_sentences
    });

    console.log('[Enhanced Generation] Sending request to OpenAI...');
    
    // Enhanced OpenAI request with better error handling
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
            content: 'You are a precise AI language learning specialist. You create perfect cloze exercises that follow the exact JSON format specified. Always return valid JSON without markdown formatting.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Enhanced Generation] OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[Enhanced Generation] Invalid OpenAI response structure:', data);
      throw new Error('Invalid response structure from OpenAI');
    }

    const content = data.choices[0].message.content;
    console.log('[Enhanced Generation] OpenAI response received');

    // Parse with enhanced recovery
    let exercise = parseOpenAIResponse(content);
    
    if (!exercise) {
      console.warn('[Enhanced Generation] JSON parsing failed, using language-aware fallback');
      exercise = createLanguageAwareFallback(language, difficulty_level, previous_sentences);
    }

    // Enhanced word usage tracking with error resilience
    if (user_id && exercise.targetWord) {
      try {
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

        console.log(`[Enhanced Generation] Tracked word usage: ${exercise.targetWord} for language: ${language}`);
      } catch (trackingError) {
        console.warn('[Enhanced Generation] Word tracking failed:', trackingError);
        // Continue without failing the entire request
      }
    }

    // Create enhanced final exercise with all safety checks
    const finalExercise = {
      sentence: exercise.sentence || "This is a sample sentence for practice.",
      translation: exercise.translation || "This is a sample translation.",
      targetWord: exercise.targetWord || "sample",
      targetWordTranslation: exercise.targetWordTranslation || "sample",
      clozeSentence: exercise.clozeSentence || exercise.sentence?.replace(exercise.targetWord, "___") || "This is a ___ sentence.",
      difficultyScore: exercise.difficultyScore || 5,
      context: exercise.context || "Practice exercise",
      hints: [exercise.targetWordTranslation || "sample"],
      correctAnswer: exercise.targetWord || "sample",
      difficulty: difficulty_level,
      exerciseType: 'cloze',
      createdAt: new Date(),
      attempts: 0,
      correctAttempts: 0,
      id: crypto.randomUUID(),
      wordSelectionReason: exercise.wordSelectionReason || selectionReasons.join(', ') || 'Standard selection',
      isReviewWord: selectedWords.length > 0,
      isNoveltyWord: novelty_words.includes(exercise.targetWord || ''),
      selectionQuality: selection_quality,
      diversityScore: diversity_score_target,
      enhancedFeatures: exercise.enhancedFeatures || {
        patternComplexity: "Standard",
        contextualRichness: "Basic",
        learningValue: "Vocabulary"
      },
      // Performance metrics
      generationTime: Date.now() - startTime,
      fallbackUsed: !parseOpenAIResponse(content),
      version: '2.0',
      // Add language validation
      generatedLanguage: language
    };

    console.log(`[Enhanced Generation] Exercise created successfully in ${Date.now() - startTime}ms`);
    console.log(`[Enhanced Generation] Target word: ${finalExercise.targetWord}, Language: ${language}, Quality: ${finalExercise.selectionQuality}`);

    return new Response(JSON.stringify(finalExercise), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Enhanced Generation] Critical error:', error);
    
    // Enhanced error recovery - never fail completely with language awareness
    try {
      const { difficulty_level, language, previous_sentences = [] } = await req.json().catch(() => ({}));
      
      const emergencyExercise = createLanguageAwareFallback(
        language || 'german', 
        difficulty_level || 'beginner', 
        previous_sentences
      );
      
      const finalExercise = {
        ...emergencyExercise,
        exerciseType: 'cloze',
        createdAt: new Date(),
        attempts: 0,
        correctAttempts: 0,
        id: crypto.randomUUID(),
        difficulty: difficulty_level || 'beginner',
        isReviewWord: false,
        isNoveltyWord: false,
        selectionQuality: 50,
        diversityScore: 50,
        generationTime: Date.now() - startTime,
        fallbackUsed: true,
        version: '2.0',
        errorRecovery: true,
        generatedLanguage: language || 'german'
      };

      console.log(`[Enhanced Generation] Emergency fallback exercise created for language: ${language || 'german'}`);
      
      return new Response(JSON.stringify(finalExercise), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (recoveryError) {
      console.error('[Enhanced Generation] Emergency recovery failed:', recoveryError);
      return new Response(JSON.stringify({ 
        error: 'Service temporarily unavailable',
        code: 'SERVICE_ERROR',
        fallback: true 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
});

function buildOptimizedPrompt(params: {
  language: string;
  difficultyLevel: string;
  enhanced_mode: boolean;
  selection_quality: number;
  diversity_score_target: number;
  finalTargetWord: string;
  selectionReasons: string[];
  novelty_words: string[];
  avoid_patterns: string[];
  n_plus_one: boolean;
  known_words: string[];
  previous_sentences: string[];
}): string {
  const {
    language,
    difficultyLevel,
    enhanced_mode,
    selection_quality,
    diversity_score_target,
    finalTargetWord,
    selectionReasons,
    novelty_words,
    avoid_patterns,
    n_plus_one,
    known_words,
    previous_sentences
  } = params;

  let prompt = `Create a cloze (fill-in-the-blank) exercise in ${language.toUpperCase()}.

STRICT REQUIREMENTS:
- Return ONLY valid JSON, no markdown formatting
- Language: ${language.toUpperCase()}
- Difficulty: ${difficultyLevel}
- Create natural, contextually appropriate sentence
- Choose ONE target word for the blank
- Provide accurate English translation of the full sentence
- Provide the English meaning of ONLY the target word (not contextual hints)

`;

  if (finalTargetWord) {
    prompt += `TARGET WORD: Use "${finalTargetWord}" as the target word if possible.
SELECTION REASON: ${selectionReasons.join('; ')}

`;
  }

  if (novelty_words.length > 0) {
    prompt += `NOVELTY WORDS (consider if appropriate): ${novelty_words.slice(0, 3).join(', ')}

`;
  }

  if (avoid_patterns.length > 0) {
    prompt += `AVOID THESE PATTERNS: ${avoid_patterns.slice(0, 3).join(', ')}
Use varied sentence structures and contexts.

`;
  }

  if (n_plus_one && known_words.length > 0) {
    prompt += `FAMILIAR VOCABULARY: ${known_words.slice(0, 15).join(', ')}
Build on familiar words but introduce appropriate challenge.

`;
  }

  if (previous_sentences.length > 0) {
    prompt += `AVOID REPETITION - Don't repeat these patterns:
${previous_sentences.slice(-3).join(' | ')}

`;
  }

  const difficultyGuidance = {
    beginner: 'Simple structure, everyday vocabulary, clear context (6-10 words)',
    intermediate: 'More complex grammar, varied vocabulary, cultural context (8-12 words)', 
    advanced: 'Sophisticated language, nuanced meanings, complex contexts (10-16 words)'
  };

  prompt += `DIFFICULTY GUIDANCE: ${difficultyGuidance[difficultyLevel as keyof typeof difficultyGuidance] || difficultyGuidance.beginner}

REQUIRED JSON FORMAT:
{
  "sentence": "Complete natural sentence in ${language}",
  "translation": "Accurate English translation of the full sentence", 
  "targetWord": "single target word",
  "targetWordTranslation": "English meaning of the target word only",
  "clozeSentence": "Sentence with ___ replacing target word",
  "difficultyScore": number between 1-10,
  "context": "When/where this sentence is used",
  "hints": ["English meaning of the target word only"],
  "enhancedFeatures": {
    "patternComplexity": "Description of sentence pattern",
    "contextualRichness": "Description of context elements", 
    "learningValue": "Educational benefit explanation"
  }
}

IMPORTANT: The "hints" array should contain ONLY the English meaning of the target word, not contextual clues that reveal the answer. For example, if the target word is "Katze" (cat), the hint should be "cat", not "an animal that meows".

Create an engaging, educational exercise that helps language learning.`;

  return prompt;
}
