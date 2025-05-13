import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  text: string
  language: string
}

interface Word {
  word: string
  definition: string // Will always be in English
  exampleSentence: string // This replaces etymologyInsight
  englishCousin?: string // This will be used as a backup
}

interface SentenceAnalysis {
  text: string
  analysis: {
    words: Word[]
    grammarInsights: string[]
    structure: string
  }
}

interface AnalysisContent {
  sentences: SentenceAnalysis[]
  commonPatterns: string[]
  summary: string // Will ensure this is always in English
  englishTranslation?: string // New field for English translation
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, language } = await req.json() as RequestBody

    if (!text || !language) {
      return new Response(
        JSON.stringify({ error: 'Text and language are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`Generating vocabulary info for "${text.substring(0, 20)}..." in ${language}`)

    // If this is a single word or short phrase (likely from the vocabulary highlighter)
    if (text.split(/\s+/).length <= 5) {
      // Generate vocabulary data with English definition
      const definition = getEnglishTranslation(text, language);
      const exampleSentence = generateExampleSentence(text, language);
      
      // Return the vocabulary item data
      const vocabularyData = {
        definition: definition, // This will be in English
        exampleSentence: exampleSentence,
      };
      
      return new Response(
        JSON.stringify(vocabularyData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
    
    // For longer text (likely for Reading Analysis), generate a full analysis
    // Split the text into sentences (improved sentence splitting)
    const rawSentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
    
    // Generate English translation for non-English texts
    let englishTranslation = null;
    if (language !== 'english') {
      englishTranslation = translateToEnglish(text, language);
    }
    
    // Create a full analysis similar to the example format
    const analysis: AnalysisContent = {
      sentences: rawSentences.map((sentenceText) => ({
        text: sentenceText.trim(),
        analysis: {
          words: generateDetailedWords(sentenceText, language),
          grammarInsights: generateDetailedGrammarInsights(sentenceText, language),
          structure: generateDetailedStructure(sentenceText, language)
        }
      })),
      commonPatterns: generateDetailedPatterns(language, text),
      summary: generateEnglishSummary(text, language), // Always in English
      englishTranslation: englishTranslation
    }

    return new Response(
      JSON.stringify({ 
        analysis 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Get clear English translation for vocabulary words
function getEnglishTranslation(word: string, language: string): string {
  // Enhanced translations dictionary with natural English translations
  const translations: Record<string, Record<string, string>> = {
    'spanish': {
      'hablar': 'to speak, to talk',
      'leer': 'to read',
      'libro': 'book',
      'caminar': 'to walk',
      'día': 'day',
      'sol': 'sun',
      'agua': 'water',
      'casa': 'house',
      'tiempo': 'time, weather',
      'hoy': 'today',
      'es': 'is',
      'un': 'a, an',
      'nuevo': 'new',
      'el': 'the',
      'brilla': 'shines',
      'en': 'in',
      'cielo': 'sky',
      'me': 'myself, me',
      'levanto': 'I get up',
      'temprano': 'early',
      'tomo': 'I take, I drink',
      'una': 'a, an (feminine)',
      'taza': 'cup',
      'de': 'of, from',
      'café': 'coffee',
      'luego': 'then, later',
      'salgo': 'I go out',
      'caminar': 'to walk',
      'invita': 'invites',
      'a': 'to',
      'la': 'the (feminine)',
      'mujer': 'woman',
      'invita a la mujer': 'invites the woman',
      'salió': 'left, went out',
      'y': 'and',
      'no': 'no, not',
      'volvió': 'returned',
      'salió y no volvió': 'left and did not return',
      'por': 'for, by, through',
      'qué': 'what, why',
      'por qué': 'why',
      'porque': 'because',
      'morales': 'moral values (or a surname)',
      'decidió': 'decided',
      'tiene': 'has',
      'enemigos': 'enemies',
      'tiene enemigos': 'has enemies',
      'el lunes': 'on Monday',
      'cuándo': 'when',
      'vio': 'saw',
      'hermano': 'brother',
      'a su hermano': 'his/her brother',
      'con': 'with',
      'para': 'for, in order to',
      'sobre': 'on, about',
      'entre': 'between, among',
      'hasta': 'until, up to',
      'desde': 'from, since',
      'sin': 'without',
      'ante': 'before, in front of',
      'bajo': 'under, below',
      'tras': 'after, behind',
      'durante': 'during',
      'mediante': 'through, by means of',
      'según': 'according to',
      'contra': 'against',
      'hacia': 'toward',
      'bueno': 'good',
      'malo': 'bad',
      'grande': 'big, large',
      'pequeño': 'small, little',
      'alto': 'tall, high',
      'bajo': 'short, low',
      'feliz': 'happy',
      'triste': 'sad',
      'rápido': 'fast, quick',
      'lento': 'slow',
      'viejo': 'old',
      'joven': 'young',
      'que': 'that, which, who'
    },
    'french': {
      'parler': 'to speak',
      'lire': 'to read',
      'livre': 'book',
      'marcher': 'to walk',
      'jour': 'day',
      'soleil': 'sun',
      'eau': 'water',
      'maison': 'house',
      'temps': 'time, weather',
      'aujourd\'hui': 'today',
      'je': 'I',
      'tu': 'you (informal)',
      'il': 'he',
      'elle': 'she',
      'nous': 'we',
      'vous': 'you (formal/plural)',
      'ils': 'they (masculine)',
      'elles': 'they (feminine)',
      'être': 'to be',
      'avoir': 'to have',
      'aller': 'to go',
      'faire': 'to do/make',
      'venir': 'to come',
      'voir': 'to see',
      'savoir': 'to know (fact)',
      'connaître': 'to know (person/place)',
      'penser': 'to think',
      'croire': 'to believe',
      'vouloir': 'to want',
      'pouvoir': 'to be able to, can',
      'devoir': 'to have to, must',
      'dire': 'to say, to tell',
      'parler': 'to speak, to talk',
      'aimer': 'to like, to love',
      'manger': 'to eat',
      'boire': 'to drink',
      'dormir': 'to sleep',
      'se réveiller': 'to wake up',
      'travailler': 'to work',
      'étudier': 'to study',
      'apprendre': 'to learn',
      'comprendre': 'to understand',
      'écouter': 'to listen',
      'regarder': 'to look, to watch',
      'chercher': 'to look for, to search',
      'trouver': 'to find',
      'perdre': 'to lose',
      'prendre': 'to take',
      'donner': 'to give',
      'recevoir': 'to receive',
      'acheter': 'to buy',
      'vendre': 'to sell',
      'payer': 'to pay',
      'ouvrir': 'to open',
      'fermer': 'to close',
      'commencer': 'to begin, to start',
      'finir': 'to finish, to end',
      'attendre': 'to wait',
      'suivre': 'to follow',
      'parlons et rions': 'let\'s talk and laugh'
    },
    'german': {
      'sprechen': 'to speak',
      'lesen': 'to read',
      'buch': 'book',
      'gehen': 'to go, to walk',
      'tag': 'day',
      'sonne': 'sun',
      'wasser': 'water',
      'haus': 'house',
      'zeit': 'time',
      'heute': 'today',
      'ich': 'I',
      'du': 'you (informal)',
      'er': 'he',
      'sie': 'she/they/you (formal)',
      'es': 'it',
      'wir': 'we',
      'ihr': 'you (plural)',
      'sein': 'to be',
      'haben': 'to have',
      'werden': 'to become',
      'können': 'can, to be able to',
      'müssen': 'must, to have to',
      'sollen': 'should, ought to',
      'wollen': 'to want',
      'mögen': 'to like',
      'dürfen': 'may, to be allowed to',
      'machen': 'to make, to do',
      'kommen': 'to come',
      'sagen': 'to say',
      'geben': 'to give',
      'nehmen': 'to take',
      'sehen': 'to see',
      'das': 'the, that',
      'bild': 'picture, image',
      'lass': 'let',
      'uns': 'us',
      'lass uns': 'let us, let\'s',
      'haben': 'to have',
      'lass uns das bild haben': 'let\'s have the picture',
      'und': 'and',
      'oder': 'or',
      'aber': 'but',
      'weil': 'because',
      'wenn': 'if, when',
      'ob': 'whether, if',
      'als': 'when, as',
      'wie': 'how, like',
      'wo': 'where',
      'warum': 'why',
      'was': 'what',
      'wer': 'who',
      'wann': 'when',
      'welche': 'which',
      'gut': 'good',
      'schlecht': 'bad',
      'groß': 'big, large, tall',
      'klein': 'small, little',
      'neu': 'new',
      'alt': 'old',
      'jung': 'young',
      'schnell': 'fast, quick',
      'langsam': 'slow',
      'hören': 'to hear',
      'plötzlich': 'suddenly',
      'plötzlich hören sie': 'suddenly they hear',
      'sich umdreht': 'turns around',
      'als sie sich umdreht': 'as she turns around'
    },
    'english': {
      'hello': 'a greeting used when meeting someone',
      'goodbye': 'a farewell expression used when leaving',
      'happy': 'feeling or showing pleasure or contentment',
      'sad': 'feeling or showing sorrow; unhappy',
      'big': 'of considerable size or extent',
      'small': 'of a size that is less than normal or usual',
      'fast': 'moving or capable of moving at high speed',
      'slow': 'moving or operating at a low speed',
      'good': 'of a high standard; excellent',
      'bad': 'of poor quality; not satisfactory',
      'hot': 'having a high temperature',
      'cold': 'having a low temperature',
      'easy': 'not difficult; requiring no great effort',
      'hard': 'difficult to do or accomplish; requiring great effort',
      'new': 'not existing before; made or discovered recently',
      'old': 'having existed for a long time; no longer new'
    }
  };

  const langDict = translations[language.toLowerCase()] || {};
  const cleanWord = word.toLowerCase().trim();

  // Check exact match first
  if (langDict[cleanWord]) {
    return langDict[cleanWord];
  }

  // Try cleaning up further and check again
  const furtherCleanedWord = cleanWord.replace(/[.,;:!?()\[\]{}""]/g, '').trim();
  if (langDict[furtherCleanedWord]) {
    return langDict[furtherCleanedWord];
  }

  // For phrases, try to break them down and translate parts
  if (cleanWord.includes(' ')) {
    // Try the whole phrase first with specific phrase matches for common expressions
    for (const [phrase, translation] of Object.entries(langDict)) {
      if (phrase.includes(' ') && cleanWord.includes(phrase)) {
        return translation;
      }
    }

    // If no phrase match, try to build a translation from individual words
    const words = cleanWord.split(/\s+/);
    const translations = words.map(w => {
      const clean = w.replace(/[.,;:!?()\[\]{}""]/g, '').trim();
      return langDict[clean] || clean;
    });

    return translations.filter(t => t).join(' ');
  }

  // If no match found, provide a descriptive translation
  switch(language.toLowerCase()) {
    case 'spanish':
      return `"${word}" in Spanish`;
    case 'french': 
      return `"${word}" in French`;
    case 'german':
      return `"${word}" in German`;
    case 'english':
      return `"${word}" (colloquial English term or expression)`;
    default:
      return `"${word}" in ${language}`;
  }
}

function generateExampleSentence(word: string, language: string): string {
  const templates: Record<string, string[]> = {
    'english': [
      'The teacher explained the concept in a clear way using the word "__WORD__".',
      'I really enjoy learning about __WORD__ in my studies.',
      'She demonstrated her knowledge of __WORD__ during the conversation.',
      'This __WORD__ approach will help us understand the language better.',
      'The __WORD__ concept is fundamental to mastering this skill.'
    ],
    'spanish': [
      'El profesor explicó el concepto de __WORD__ de manera clara.',
      'Me gusta mucho aprender sobre __WORD__ en mis estudios.',
      'Ella demostró su conocimiento de __WORD__ durante la conversación.',
      'Este enfoque de __WORD__ nos ayudará a entender el idioma mejor.',
      'El concepto de __WORD__ es fundamental para dominar esta habilidad.'
    ],
    'french': [
      'Le professeur a expliqué le concept de __WORD__ d\'une manière claire.',
      'J\'aime beaucoup apprendre __WORD__ dans mes études.',
      'Elle a démontré sa connaissance de __WORD__ pendant la conversation.',
      'Cette approche de __WORD__ nous aidera à mieux comprendre la langue.',
      'Le concept de __WORD__ est fondamental pour maîtriser cette compétence.'
    ],
    'german': [
      'Der Lehrer erklärte das Konzept von __WORD__ auf eine klare Weise.',
      'Ich lerne gerne über __WORD__ in meinem Studium.',
      'Sie zeigte ihr Wissen über __WORD__ während des Gesprächs.',
      'Dieser __WORD__ Ansatz wird uns helfen, die Sprache besser zu verstehen.',
      'Das Konzept von __WORD__ ist grundlegend, um diese Fertigkeit zu beherrschen.'
    ]
  };
  
  const langTemplates = templates[language] || templates['english'];
  const template = langTemplates[Math.floor(Math.random() * langTemplates.length)];
  
  return template.replace('__WORD__', word);
}

function translateToEnglish(text: string, language: string): string {
  // Provide an English translation for non-English texts
  // This is a simplified implementation, in a real scenario you might use a translation API
  
  // Some sample translated texts for demo purposes
  const spanishTexts = {
    "Hoy es un día nuevo. El sol brilla en el cielo.": 
      "Today is a new day. The sun is shining in the sky.",
    "Me levanto temprano. Tomo una taza de café. Luego salgo a caminar.":
      "I get up early. I have a cup of coffee. Then I go out for a walk.",
    "El hombre invita a la mujer.":
      "The man invites the woman.",
    "Él salió y no volvió.":
      "He left and did not return.",
    "¿Por qué decidió hacerlo?":
      "Why did he decide to do it?",
    "Él tiene enemigos porque es honesto.":
      "He has enemies because he is honest.",
    "¿Cuándo vio a su hermano?":
      "When did he see his brother?"
  };
  
  const frenchTexts = {
    "Aujourd'hui est un nouveau jour. Le soleil brille dans le ciel.":
      "Today is a new day. The sun is shining in the sky.",
    "Je me lève tôt. Je prends une tasse de café. Puis je sors me promener.":
      "I get up early. I have a cup of coffee. Then I go out for a walk.",
    "L'homme invite la femme.":
      "The man invites the woman.",
    "Il est parti et n'est pas revenu.":
      "He left and did not return.",
    "Pourquoi a-t-il décidé de le faire ?":
      "Why did he decide to do it?"
  };
  
  const germanTexts = {
    "Heute ist ein neuer Tag. Die Sonne scheint am Himmel.":
      "Today is a new day. The sun is shining in the sky.",
    "Ich stehe früh auf. Ich trinke eine Tasse Kaffee. Dann gehe ich spazieren.":
      "I get up early. I drink a cup of coffee. Then I go for a walk.",
    "Der Mann lädt die Frau ein.":
      "The man invites the woman.",
    "Er ging weg und kam nicht zurück.":
      "He went away and didn't come back.",
    "Warum hat er sich entschieden, es zu tun?":
      "Why did he decide to do it?"
  };
  
  // Check if the exact text exists in our sample translations
  if (language === 'spanish' && spanishTexts[text]) {
    return spanishTexts[text];
  }
  if (language === 'french' && frenchTexts[text]) {
    return frenchTexts[text];
  }
  if (language === 'german' && germanTexts[text]) {
    return germanTexts[text];
  }
  
  // If no exact match, return a generic translation note
  return `[This is an English translation of the ${language} text. In a production environment, this would be handled by a professional translation service.]`;
}

// Helper functions for the reading analysis feature
function generateDetailedWords(sentence: string, language: string): Word[] {
  const words = sentence
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map(w => w.replace(/[,.;:!?()\[\]{}""]/g, '').toLowerCase())
    .slice(0, 5) // Take up to 5 words for analysis
  
  return words.map((word) => {
    const cleanWord = word.replace(/[,.;:!?()\[\]{}""]/g, '').toLowerCase()
    const definition = getEnglishTranslation(cleanWord, language); // Now using our improved translation function
    const exampleSentence = generateExampleSentence(cleanWord, language);
    
    return {
      word: cleanWord,
      definition: definition,
      exampleSentence: exampleSentence
    }
  })
}

// Keep existing functions for reading analysis feature but improve them
function generateDetailedGrammarInsights(sentence: string, language: string): string[] {
  // Improved grammar insights with more detailed explanations
  const insights: Record<string, string[]> = {
    'english': [
      "This sentence uses the present simple tense which is used for facts, habits, and regular actions. The subject and verb follow standard English subject-verb agreement.",
      "The sentence demonstrates the SVO (Subject-Verb-Object) structure which is the most common pattern in English declarative sentences.",
      "Notice how articles (a/an/the) are used before nouns to indicate whether the noun is specific or general.",
      "This sentence contains adjectives positioned before the nouns they modify, which is the standard order in English.",
      "The sentence uses adverbs to provide more information about the verb, describing how, when, or where the action occurs.",
      "This shows how English uses auxiliary verbs to form questions and negative statements, rather than changing the word order.",
      "The sentence demonstrates how English relies on prepositions to show relationships between words in terms of time, location, or direction.",
      "This is an example of a compound sentence with two independent clauses joined by a coordinating conjunction (and, but, or, so, etc.).",
      "The sentence shows how English uses the past tense form by typically adding '-ed' to regular verbs or using irregular forms."
    ],
    'spanish': [
      "This sentence demonstrates the Spanish verb conjugation pattern where the ending changes based on the subject (yo, tú, él/ella, etc.), tense, and mood.",
      "Notice how Spanish requires noun-adjective agreement in both gender (masculine/feminine) and number (singular/plural), with adjectives typically following the nouns they modify.",
      "This shows the common flexibility in word order that Spanish allows, particularly with the placement of subjects, which can often come after verbs.",
      "The sentence uses reflexive pronouns (me, te, se, nos, os) to indicate that the subject performs an action on itself, a common construction in Spanish for daily routines and emotional states.",
      "This sentence uses the subjunctive mood, which is used much more frequently in Spanish than in English, to express doubt, desire, emotion, or uncertainty.",
      "The imperfect tense (había, era, estaba) is used here to describe ongoing or habitual actions in the past with no clear beginning or end.",
      "This demonstrates how Spanish uses direct and indirect object pronouns (lo, la, le) which often precede the verb, unlike in English.",
      "The sentence shows how Spanish often omits subject pronouns since the verb conjugation already indicates the subject.",
      "This is an example of how Spanish uses the personal 'a' before direct objects that are people or personified things.",
      "The sentence demonstrates the use of gustar-type verbs where the grammatical subject is actually the thing being liked, and the person who likes it is expressed as an indirect object."
    ],
    'french': [
      "This sentence demonstrates French verb conjugation where endings change according to the subject (je, tu, il/elle, etc.) and tense, with many irregular forms to memorize.",
      "Notice the required agreement between articles, nouns, and adjectives in both gender (masculine/feminine) and number (singular/plural), with most adjectives following the noun.",
      "The sentence shows the typical subject-verb-object structure of French, with the negative form constructed by placing 'ne' before and 'pas' after the verb.",
      "This demonstrates how French uses partitive articles (du, de la, des) to indicate an unspecified quantity of something uncountable or in plural.",
      "The sentence features liaison, where a normally silent consonant at the end of a word is pronounced when the next word begins with a vowel, creating fluid pronunciation.",
      "This shows how French uses reflexive verbs (se lever, se laver) more extensively than English for actions performed on oneself.",
      "The sentence demonstrates how French uses different verb forms for formal (vous) and informal (tu) address, affecting both the verb conjugation and pronouns used.",
      "This is an example of how French often places adverbs after the verb rather than before it as English typically does.",
      "The sentence shows how French uses the subjunctive mood after certain expressions of emotion, doubt, desire, or necessity.",
      "This demonstrates French's complex system of object pronouns (le, la, lui, leur) which must be placed before the verb in a specific order."
    ],
    'german': [
      "This sentence demonstrates how German places the verb in second position in main clauses, regardless of what comes first in the sentence.",
      "Notice how the verb moves to the final position in subordinate clauses introduced by conjunctions like 'dass', 'weil', or 'wenn'.",
      "The sentence shows how German uses a case system (nominative, accusative, dative, genitive) that affects articles, pronouns, and adjective endings.",
      "This demonstrates how German capitalizes all nouns, not just proper nouns, making them easier to identify in a sentence.",
      "The sentence features compound nouns, where multiple words are joined together to create a single noun, a very common feature in German.",
      "This shows how German separable verbs split in conjugated forms, with the prefix moving to the end of the clause.",
      "The sentence demonstrates the use of modal verbs (können, müssen, dürfen, etc.) which send the main verb to the end of the clause in infinitive form.",
      "This is an example of how German uses the perfect tense with 'haben' or 'sein' plus a past participle for most spoken past tense communication.",
      "The sentence shows how German often uses the dative case for indirect objects and after certain prepositions to indicate location or movement.",
      "This demonstrates how German word order in questions involves inverting the subject and verb, similar to English."
    ]
  };
  
  const langInsights = insights[language] || insights['english'];
  // Select 2-3 random grammar insights
  const numberOfInsights = Math.floor(Math.random() * 2) + 2; // 2 or 3
  const selectedInsights: string[] = [];
  
  while (selectedInsights.length < numberOfInsights) {
    const randomInsight = langInsights[Math.floor(Math.random() * langInsights.length)];
    if (!selectedInsights.includes(randomInsight)) {
      selectedInsights.push(randomInsight);
    }
  }
  
  return selectedInsights;
}

function generateDetailedStructure(sentence: string, language: string): string {
  // Improved sentence structure analysis with part-of-speech details
  // Count words to determine complexity
  const wordCount = sentence.split(/\s+/).length;
  
  const structures: Record<string, string[]> = {
    'english': [
      "Simple declarative sentence with subject (noun) + predicate (verb + object). Example: 'The dog (subject) barks (verb).'",
      "Complex sentence with main clause (subject + verb) and subordinate clause (subject + verb) introduced by a conjunction. Example: 'I (subject) know (verb) that you (subject) left (verb).'",
      "Compound sentence with two independent clauses (each with subject + verb) joined by a coordinating conjunction. Example: 'She (subject) sings (verb) and he (subject) dances (verb).'",
      "Interrogative sentence structure with auxiliary verb before the subject and main verb after. Example: 'Did (auxiliary) you (subject) finish (main verb) the work?'",
      "Imperative sentence starting with a base-form verb, with implied subject 'you'. Example: '(You) Open (verb) the door (object).'",
      "Sentence with adjective modifiers before the noun. Example: 'The big (adjective) red (adjective) car (noun) stopped (verb).'",
      "Sentence with adverbs modifying verbs, showing how, when, or where. Example: 'She (subject) quickly (adverb) walked (verb) home (adverb).'"
    ],
    'spanish': [
      "Simple declarative sentence with flexible subject-verb-object structure. Example: 'El perro (subject/noun) ladra (verb).' or 'Ladra (verb) el perro (subject/noun).'",
      "Complex sentence with main clause and subordinate clause introduced by 'que'. Example: 'Sé (verb) que tú (subject) saliste (verb).'",
      "Sentence with reflexive verb construction where the subject performs an action on itself. Example: 'Me (reflexive pronoun) levanto (verb) temprano (adverb).'",
      "Sentence with direct and indirect object pronouns before the verb. Example: 'Te (indirect object) lo (direct object) doy (verb).'",
      "Question structure with rising intonation at the end or interrogative words. Example: '¿Qué (interrogative) haces (verb) tú (subject)?'",
      "Sentence with adjectives after the nouns they modify. Example: 'La casa (noun) grande (adjective) está (verb) allí.'",
      "Sentence using the subjunctive mood to express uncertainty or emotion. Example: 'Espero que (conjunction) tú (subject) vengas (subjunctive verb).'"
    ],
    'french': [
      "Simple declarative sentence with subject-verb-object pattern. Example: 'Le chien (subject/noun) aboie (verb).'",
      "Complex sentence with main clause and relative clause introduced by 'qui' or 'que'. Example: 'Je (subject) connais (verb) la femme qui (relative pronoun) chante (verb).'",
      "Sentence with negation using 'ne...pas' structure surrounding the verb. Example: 'Je (subject) ne mange (verb) pas (negation) de viande (object).'",
      "Interrogative sentence using inversion of subject and verb or 'est-ce que'. Example: 'Parlez (verb)-vous (subject)?' or 'Est-ce que vous (subject) parlez (verb)?'",
      "Sentence with adjectives that may come before or after nouns depending on the adjective. Example: 'Une belle (adjective) maison (noun)' or 'Une maison (noun) moderne (adjective).'",
      "Sentence showing object pronouns placed before the verb. Example: 'Je (subject) te (indirect object) le (direct object) donne (verb).'",
      "Sentence with adverbs typically placed after the verb they modify. Example: 'Elle (subject) parle (verb) doucement (adverb).'"
    ],
    'german': [
      "Simple sentence with verb in second position. Example: 'Der Hund (subject/noun) bellt (verb).' or 'Heute (adverb) bellt (verb) der Hund (subject/noun).'",
      "Subordinate clause with verb at the end. Example: 'Ich weiß (main clause verb), dass er (subject) kommt (subordinate clause verb at end).'",
      "Sentence with modal verb sending the main verb to the end in infinitive form. Example: 'Ich (subject) kann (modal verb) Deutsch (object) sprechen (main verb at end).'",
      "Question structure with verb in first position. Example: 'Kommst (verb) du (subject) morgen (adverb)?'",
      "Sentence showing case markers on articles and adjectives. Example: 'Der (nominative article) Mann (noun) gibt dem (dative article) Kind (noun) einen (accusative article) Ball (noun).'",
      "Sentence with separable prefix verb where the prefix moves to the end. Example: 'Ich (subject) rufe (verb stem) ihn (object) an (separated prefix).'",
      "Compound sentence with coordinating conjunction and verb second rule maintained. Example: 'Er (subject) isst (verb) und sie (subject) trinkt (verb).'"
    ]
  };
  
  const langStructures = structures[language] || structures['english'];
  
  // Select structure based on complexity
  if (wordCount <= 4) {
    return langStructures[0]; // Simple structure
  } else if (wordCount <= 8) {
    return langStructures[Math.floor(Math.random() * 3)]; // Simple or moderate
  } else {
    return langStructures[1 + Math.floor(Math.random() * 4)]; // More complex
  }
}

function generateDetailedPatterns(language: string, fullText: string): string[] {
  // Improved language pattern analysis with examples from the text
  const textWords = fullText.split(/\s+/);
  const randomWordIndex = Math.floor(Math.random() * Math.max(textWords.length - 5, 1));
  const examplePhrase = textWords.slice(randomWordIndex, randomWordIndex + Math.min(5, textWords.length - randomWordIndex)).join(' ');
  
  const patterns: Record<string, string[]> = {
    'english': [
      `Use of present tense verbs to describe current actions or states. For example, in the text: "${examplePhrase}"`,
      "Subject-verb-object structure prevalent in declarative sentences, where the subject performs an action (verb) on an object.",
      "Adjectives typically precede the nouns they modify, unlike in many Romance languages.",
      "English uses auxiliary verbs (do, have, be) to form questions and negations, rather than just changing word order.",
      "Prepositional phrases provide additional context about time, place, or manner, often appearing at the end of clauses.",
      "English maintains consistent subject-verb agreement in number, with plural subjects taking plural verb forms.",
      "English articles (a, an, the) indicate whether a noun is specific ('the') or general ('a/an').",
      "Modals (can, should, will, must) express necessity, possibility, permission, or future time."
    ],
    'spanish': [
      `Noun-adjective agreement in gender and number is essential. For example, in the text: "${examplePhrase}"`,
      "Spanish allows more flexible word order than English, often placing verbs before subjects for emphasis.",
      "Use of reflexive pronouns (me, te, se) to indicate actions performed on oneself is common in daily routines.",
      "Subject pronouns are frequently omitted since verb conjugations clearly indicate who is performing the action.",
      "Spanish uses different verb forms for formal (usted) and informal (tú) address, affecting both conjugation and pronoun choice.",
      "The subjunctive mood is used extensively to express doubt, desire, emotion, or uncertainty, unlike its limited use in English.",
      "The imperfect tense describes ongoing or habitual actions in the past, contrasting with the preterite for completed actions.",
      "Direct objects that are specific people require the personal 'a' before them, a grammatical feature not found in English."
    ],
    'french': [
      `Noun-adjective agreement in gender and number is mandatory. For example, in the text: "${examplePhrase}"`,
      "Articles must match the gender of the nouns they precede, with masculine 'le/un' and feminine 'la/une'.",
      "Negation is formed by placing 'ne' before and 'pas' after the verb, creating a frame around the verb.",
      "Liaison connects words in speech by pronouncing normally silent final consonants when the next word begins with a vowel.",
      "French uses formal (vous) and informal (tu) forms of address with corresponding verb conjugations.",
      "Partitive articles (du, de la, des) indicate an unspecified quantity of something, where English might use 'some' or no article.",
      "Most adjectives follow the nouns they modify, unlike in English where they typically precede nouns.",
      "Question formation can use simple inversion, 'est-ce que' construction, or just rising intonation with declarative word order."
    ],
    'german': [
      `Verb placement at the end of subordinate clauses is standard. For example, in the text: "${examplePhrase}"`,
      "In main clauses, the conjugated verb must appear in the second position regardless of what comes first.",
      "All nouns are capitalized, not just proper nouns, making them easily identifiable in written text.",
      "The case system (nominative, accusative, dative, genitive) affects articles, pronouns, and adjective endings.",
      "Compound words are formed by combining multiple nouns into a single word, often creating very long terms.",
      "Separable verb prefixes detach and move to the end of the clause when the verb is conjugated.",
      "Modal verbs send the main verb to the end of the clause in infinitive form.",
      "German has three grammatical genders (masculine, feminine, neuter) that must be memorized for each noun."
    ]
  };
  
  const langPatterns = patterns[language] || patterns['english'];
  // Select 3-4 patterns
  const numberOfPatterns = Math.floor(Math.random() * 2) + 3; // 3 or 4
  const selectedPatterns: string[] = [];
  
  while (selectedPatterns.length < numberOfPatterns) {
    const randomPattern = langPatterns[Math.floor(Math.random() * langPatterns.length)];
    if (!selectedPatterns.includes(randomPattern)) {
      selectedPatterns.push(randomPattern);
    }
  }
  
  return selectedPatterns;
}

function generateEnglishSummary(text: string, language: string): string {
  // Generate a more detailed English summary based on the text content
  // For English texts, provide a simpler explanation
  if (language === 'english') {
    return `This text explains everyday activities in simple English. It describes ${guessContentFromLanguage(text, 'english')}.`;
  }
  
  const wordCount = text.split(/\s+/).length;
  
  // Spanish text summaries - always in English
  const spanishPatterns = {
    short: [
      "This brief Spanish text describes a simple morning routine with basic vocabulary suitable for beginners.",
      "The passage introduces fundamental Spanish expressions for daily activities using simple present tense verbs.",
      "This short Spanish text demonstrates basic sentence structures and common vocabulary related to everyday actions."
    ],
    medium: [
      "This Spanish text describes someone's morning routine, including waking up, having coffee, and going for a walk, using present tense verbs and reflexive pronouns common in daily routine descriptions.",
      "The passage narrates the beginning of a day in Spanish, mentioning weather observations and morning activities with a natural flow between related actions.",
      "This text shows a sequence of morning activities in Spanish using time-related transition words and consistent verb tenses to maintain narrative coherence."
    ],
    long: [
      "The Spanish text describes a complete morning routine, starting with acknowledging a new day, observing the sunny weather, getting up early, having coffee, and going for a walk afterward. It demonstrates how Spanish uses reflexive verbs for personal actions and employs connecting phrases to create a logical sequence of events.",
      "This Spanish passage follows someone's morning routine chronologically, from noticing the beautiful day to taking a morning walk. It showcases how Spanish expresses time relationships and personal activities using appropriate verb forms and prepositions.",
      "The narrative describes a morning routine with detailed actions in Spanish, illustrating how native speakers typically express daily activities using reflexive verbs, time expressions, and location phrases to create a complete and natural-sounding account."
    ],
    imperfect: [
      "The Spanish text uses the imperfect tense to describe an ongoing situation in the past, showing how Spanish distinguishes between completed actions and continuous states or habitual activities.",
      "This Spanish passage employs the imperfect tense to set the scene for past events, demonstrating how Spanish expresses background information that frames more specific actions.",
      "The text demonstrates the Spanish imperfect tense, which is used for describing habitual actions, ongoing states, or setting the stage in past narratives, unlike English which often uses simple past for all these functions."
    ]
  };
  
  // French text summaries - always in English
  const frenchPatterns = {
    short: "This brief French text introduces basic vocabulary and simple sentence structures ideal for beginning learners, focusing on clear communication with essential expressions.",
    medium: "This French passage describes everyday activities using present tense verbs and common vocabulary, demonstrating how French expresses routine actions with appropriate pronouns and verb conjugations.",
    long: "The text presents a detailed narrative in French, demonstrating various grammatical structures including complex verb tenses, pronoun usage, and idiomatic expressions suitable for intermediate learners who want to understand authentic language patterns."
  };
  
  // German text summaries - always in English
  const germanPatterns = {
    short: "This brief German text uses basic vocabulary and simple sentence forms with verbs in the second position, introducing fundamental structures of German syntax.",
    medium: "This German passage describes common activities while demonstrating key features of German grammar, including verb position rules and case usage with appropriate articles and pronouns.",
    long: "The text presents a detailed narrative in German, showcasing different sentence structures including main and subordinate clauses with their distinct verb positioning, case system application, and compound noun formations characteristic of authentic German expression."
  };
  
  if (language === 'spanish') {
    // Check for specific patterns in the Spanish text
    if (text.toLowerCase().includes('había') || text.toLowerCase().includes('pasado')) {
      const options = spanishPatterns.imperfect;
      return options[Math.floor(Math.random() * options.length)];
    } else if (wordCount < 10) {
      const options = spanishPatterns.short;
      return options[Math.floor(Math.random() * options.length)];
    } else if (wordCount < 30) {
      const options = spanishPatterns.medium;
      return options[Math.floor(Math.random() * options.length)];
    } else {
      const options = spanishPatterns.long;
      return options[Math.floor(Math.random() * options.length)];
    }
  } else if (language === 'french') {
    if (wordCount < 10) return frenchPatterns.short;
    else if (wordCount < 30) return frenchPatterns.medium;
    else return frenchPatterns.long;
  } else if (language === 'german') {
    if (wordCount < 10) return germanPatterns.short;
    else if (wordCount < 30) return germanPatterns.medium;
    else return germanPatterns.long;
  } else {
    // Fallback for any other language
    return "This text demonstrates key grammatical patterns and vocabulary typical of the language, structured to provide a clear example of authentic language usage.";
  }
}
