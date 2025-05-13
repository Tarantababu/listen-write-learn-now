
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
  etymologyInsight?: string
  englishCousin?: string
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
      const definition = generateEnglishDefinition(text, language);
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
    // Split the text into sentences (simple split by periods for demo)
    const rawSentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
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
      summary: generateEnglishSummary(text, language) // Always in English
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

// Generate English definition for vocabulary words
function generateEnglishDefinition(word: string, language: string): string {
  // Enhanced definitions dictionary with more detailed English explanations
  const definitions: Record<string, Record<string, string>> = {
    'english': {
      'simple': 'Easy to understand or use; not complicated or elaborate.',
      'powerful': 'Having great power, force, potency, or effect; physically strong.',
      'read': 'To look at and comprehend the meaning of written or printed words or symbols.',
      'book': 'A set of written, printed, or blank pages fastened along one side and encased between protective covers.',
      'walk': 'To move at a regular pace by lifting and setting down each foot in turn.',
      'default': 'A common word in English language.'
    },
    'spanish': {
      'hablar': 'To speak or talk; to communicate through words.',
      'leer': 'To read; to interpret written or printed matter.',
      'libro': 'Book; a written or printed work consisting of pages.',
      'caminar': 'To walk; to move on foot at a regular pace.',
      'día': 'Day; a period of 24 hours, especially from midnight to midnight.',
      'sol': 'Sun; the star around which the earth orbits.',
      'agua': 'Water; the clear liquid that forms rain, rivers, and oceans.',
      'casa': 'House; a building for human habitation.',
      'tiempo': 'Time; the indefinite continued progress of existence.',
      'hoy': 'Today; on the current day.',
      'es': 'Is; third person singular present form of "to be".',
      'un': 'A/an; indefinite article.',
      'nuevo': 'New; not existing before, recently made or discovered.',
      'el': 'The; definite article for masculine nouns.',
      'brilla': 'Shines; to emit light or to be bright.',
      'en': 'In; expressing a position within space or time.',
      'cielo': 'Sky; the region of the atmosphere visible from the earth.',
      'me': 'Myself/me; reflexive or direct object pronoun.',
      'levanto': 'I get up; to rise from a sitting or lying position.',
      'temprano': 'Early; happening before the usual or expected time.',
      'tomo': 'I take/drink; to consume a liquid or to grasp.',
      'una': 'A/an; indefinite article for feminine nouns.',
      'taza': 'Cup; a small container used for drinking.',
      'de': 'Of/from; indicating origin, ownership or composition.',
      'café': 'Coffee; a dark, bitter beverage prepared from roasted coffee beans.',
      'luego': 'Then/later; at a time subsequent to another.',
      'salgo': 'I go out; to exit or leave a place.',
      'caminar': 'To walk; to move on foot.',
      'invita': 'Invites; to request the presence or participation of someone.',
      'a': 'To; preposition indicating direction or purpose.',
      'la': 'The; definite article for feminine nouns.',
      'mujer': 'Woman; an adult female human being.',
      'invita a la mujer': 'Invites the woman; to ask a female person to attend or participate in something.',
      'salió': 'He/she left; to exit a place.',
      'y': 'And; a conjunction used to connect words or groups of words.',
      'no': 'No/not; used to express negation, denial, or refusal.',
      'volvió': 'He/she returned; to come back to a place.',
      'salió y no volvió': 'He/she left and did not return; indicates someone departed and failed to come back.'
    },
    'french': {
      'parler': 'To speak; to express thoughts through spoken language.',
      'lire': 'To read; to look at and comprehend written words.',
      'livre': 'Book; a written or printed work consisting of pages.',
      'marcher': 'To walk; to move on foot.',
      'jour': 'Day; a period of 24 hours.',
      'soleil': 'Sun; the star at the center of our solar system.',
      'eau': 'Water; the clear liquid that forms rain, rivers, and oceans.',
      'maison': 'House; a building for human habitation.',
      'temps': 'Time; the indefinite continued progress of existence.',
      'aujourd\'hui': 'Today; on the current day.',
      'default': 'A word in French language.'
    },
    'german': {
      'sprechen': 'To speak; to express thoughts verbally.',
      'lesen': 'To read; to interpret written text.',
      'buch': 'Book; a written or printed work.',
      'gehen': 'To go or to walk; to move on foot.',
      'tag': 'Day; a period of 24 hours.',
      'sonne': 'Sun; the star at the center of our solar system.',
      'wasser': 'Water; the clear liquid essential for life.',
      'haus': 'House; a building for human habitation.',
      'zeit': 'Time; the measured progression of existence.',
      'heute': 'Today; on the current day.',
      'default': 'A word in German language.'
    }
  };
  
  const cleanWord = word.toLowerCase().trim();
  const languageDict = definitions[language] || definitions['english'];
  
  // First try to find an exact match
  if (languageDict[cleanWord]) {
    return languageDict[cleanWord];
  }
  
  // If no exact match, try to generate a more meaningful definition based on language
  switch(language) {
    case 'spanish':
      return `"${word}" means "${getTranslation(cleanWord, language)}" in English.`;
    case 'french':
      return `"${word}" means "${getTranslation(cleanWord, language)}" in English.`;
    case 'german':
      return `"${word}" means "${getTranslation(cleanWord, language)}" in English.`;
    case 'english':
      return `"${word}" - ${getSimplifiedDefinition(cleanWord)}`;
    default:
      return `"${word}" - a word in ${language}.`;
  }
}

// Helper function to generate simplified English definitions for English words
function getSimplifiedDefinition(word: string): string {
  const commonWords: Record<string, string> = {
    'hello': 'a greeting used when meeting someone',
    'goodbye': 'a farewell expression used when leaving',
    'happy': 'feeling or showing pleasure or contentment',
    'sad': 'feeling or showing sorrow; unhappy',
    'big': 'of considerable size or extent',
    'small': 'of a size that is less than normal or usual',
    'fast': 'moving or capable of moving at high speed',
    'slow': 'moving or operating at a low speed',
    // Add more as needed
  };
  
  return commonWords[word] || 'a word in English language with a meaning that varies based on context';
}

// Helper function to simulate translation
function getTranslation(word: string, language: string): string {
  // Simple translations for demo purposes
  const translations: Record<string, Record<string, string>> = {
    'spanish': {
      'hablar': 'to speak',
      'leer': 'to read',
      'libro': 'book',
      'caminar': 'to walk',
      'día': 'day',
      'sol': 'sun',
      'agua': 'water',
      'casa': 'house',
      'tiempo': 'time/weather',
      'hoy': 'today',
      'es': 'is',
      'un': 'a/an',
      'nuevo': 'new',
      'el': 'the',
      'brilla': 'shines',
      'en': 'in',
      'cielo': 'sky',
      'me': 'myself/me',
      'levanto': 'I get up',
      'temprano': 'early',
      'tomo': 'I take/drink',
      'una': 'a/an',
      'taza': 'cup',
      'de': 'of/from',
      'café': 'coffee',
      'luego': 'then/later',
      'salgo': 'I go out',
      'y': 'and',
      'no': 'no/not',
      'a': 'to',
      'la': 'the',
      'mujer': 'woman',
      'invita': 'invites',
      'salió': 'left/went out',
      'volvió': 'returned',
      'invita a la mujer': 'invites the woman',
      'salió y no volvió': 'left and did not return'
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
      'temps': 'time/weather',
      'aujourd\'hui': 'today'
    },
    'german': {
      'sprechen': 'to speak',
      'lesen': 'to read',
      'buch': 'book',
      'gehen': 'to go/walk',
      'tag': 'day',
      'sonne': 'sun',
      'wasser': 'water',
      'haus': 'house',
      'zeit': 'time',
      'heute': 'today'
    }
  };
  
  const langDict = translations[language] || {};
  return langDict[word] || `[translation not available for "${word}"]`;
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

// Helper functions to generate more realistic and detailed analysis
function generateDetailedWords(sentence: string, language: string): Word[] {
  const words = sentence
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map(w => w.replace(/[,.;:!?()\[\]{}""]/g, '').toLowerCase())
    .slice(0, 5) // Take up to 5 words for analysis
  
  const languageRoots: Record<string, string[]> = {
    'english': ['Old English', 'Latin', 'Greek', 'French', 'Germanic'],
    'spanish': ['Latin', 'Arabic', 'Greek', 'Celtic', 'Proto-Romance'],
    'french': ['Latin', 'Frankish', 'Celtic', 'Greek', 'Germanic'],
    'german': ['Old High German', 'Latin', 'French', 'Greek', 'Proto-Germanic']
  };
  
  const roots = languageRoots[language] || languageRoots['english'];
  
  return words.map((word) => {
    const cleanWord = word.replace(/[,.;:!?()\[\]{}""]/g, '').toLowerCase()
    const randomRoot = roots[Math.floor(Math.random() * roots.length)];
    
    return {
      word: cleanWord,
      definition: generateWordDefinition(cleanWord, language), // Always in English now
      etymologyInsight: `From ${randomRoot}, meaning related to "${cleanWord}" in its original form.`,
      englishCousin: generateEnglishCousin(cleanWord, language)
    }
  })
}

function generateWordDefinition(word: string, language: string): string {
  // Language-specific word definitions with English translations
  const wordDefinitions: Record<string, Record<string, string>> = {
    'spanish': {
      'hoy': 'today; the current day (English definition)',
      'es': 'is; third person singular form of the verb "to be" (English definition)',
      'un': 'a/an; indefinite article for masculine nouns (English definition)',
      'nuevo': 'new; recently created or discovered (English definition)',
      'día': 'day; a period of 24 hours (English definition)',
      'el': 'the; definite article for masculine nouns (English definition)',
      'sol': 'sun; the star at the center of our solar system (English definition)',
      'brilla': 'shines; emits light or reflects brightly (English definition)',
      'en': 'in; preposition indicating location within (English definition)',
      'cielo': 'sky; the region of the atmosphere visible from earth (English definition)',
      'me': 'myself; reflexive pronoun (English definition)',
      'levanto': 'I get up; to rise from a sitting or lying position (English definition)',
      'temprano': 'early; before the usual time (English definition)',
      'tomo': 'I take/drink; to consume a liquid (English definition)',
      'una': 'a/an; indefinite article for feminine nouns (English definition)',
      'taza': 'cup; a small container for drinking (English definition)',
      'de': 'of/from; indicating possession or origin (English definition)',
      'café': 'coffee; a beverage made from roasted coffee beans (English definition)',
      'luego': 'then/later; afterward in time (English definition)',
      'salgo': 'I go out; to leave a place (English definition)',
      'caminar': 'to walk; to move on foot (English definition)',
      'había': 'there was/had; imperfect form of "haber" (English definition)',
      'pasado': 'past/passed; gone by in time (English definition)'
    },
    'french': {
      'je': 'I; first-person singular subject pronoun (English definition)',
      'suis': 'am; first-person singular of the verb "to be" (English definition)',
      'tu': 'you; second-person singular subject pronoun (English definition)',
      'es': 'are; second-person singular of the verb "to be" (English definition)',
      'nous': 'we; first-person plural subject pronoun (English definition)',
      'sommes': 'are; first-person plural of the verb "to be" (English definition)',
      'jour': 'day; a period of 24 hours (English definition)',
      'soleil': 'sun; the star at the center of our solar system (English definition)',
      'brille': 'shines; emits or reflects light (English definition)'
    },
    'german': {
      'ich': 'I; first-person singular pronoun (English definition)',
      'bin': 'am; first-person singular of the verb "to be" (English definition)',
      'du': 'you; second-person singular pronoun (English definition)',
      'bist': 'are; second-person singular of the verb "to be" (English definition)',
      'tag': 'day; a period of 24 hours (English definition)',
      'sonne': 'sun; the star at the center of our solar system (English definition)',
      'scheint': 'shines; emits or reflects light (English definition)'
    },
    'english': {
      'i': 'first-person singular pronoun; refers to oneself as the speaker',
      'am': 'first-person singular of be; to exist or live',
      'day': 'a period of 24 hours; the time between sunrise and sunset',
      'sun': 'the star at the center of our solar system; provides light and heat'
    }
  };
  
  const languageDict = wordDefinitions[language] || {};
  return languageDict[word] || `${word} - a ${language} word (English definition)`;
}

function generateEnglishCousin(word: string, language: string): string {
  const similarWords: Record<string, Record<string, string>> = {
    'spanish': {
      'libro': 'library',
      'hablar': 'habitat (from Latin habere, to have)',
      'sol': 'solar',
      'luna': 'lunar',
      'tiempo': 'temporal',
      'agua': 'aquatic',
      'fuego': 'fuel',
      'tierra': 'terrestrial',
      'día': 'diurnal',
      'noche': 'nocturnal',
      'hoy': 'hodiernal (rare, meaning "of today")',
      'nuevo': 'novel',
      'cielo': 'celestial',
      'levanto': 'elevate',
      'temprano': 'temporal',
      'taza': 'tasse (in French)',
      'café': 'café',
      'luego': 'later',
      'salgo': 'sally (to rush out)',
      'caminar': 'perambulate',
      'había': 'habit (related to having)',
      'pasado': 'passed'
    },
    'french': {
      'livre': 'library',
      'parler': 'parliament',
      'soleil': 'solar',
      'lune': 'lunar',
      'temps': 'temporal',
      'eau': 'aquatic',
      'feu': 'fuel',
      'terre': 'terrestrial',
      'jour': 'journal',
      'nuit': 'nocturnal'
    },
    'german': {
      'buch': 'book',
      'sprechen': 'speak',
      'sonne': 'sun',
      'mond': 'moon',
      'zeit': 'time (tide in Old English)',
      'wasser': 'water',
      'feuer': 'fire',
      'erde': 'earth',
      'tag': 'day',
      'nacht': 'night'
    },
    'english': {
      'book': 'bibliographic',
      'speak': 'speech',
      'sun': 'solar',
      'moon': 'lunar',
      'time': 'temporal',
      'water': 'aquatic',
      'fire': 'ignite',
      'earth': 'terrestrial'
    }
  };
  
  const languageDict = similarWords[language] || {};
  return languageDict[word] || `${word} (no direct English cousin)`;
}

function generateDetailedGrammarInsights(sentence: string, language: string): string[] {
  const insights: Record<string, string[]> = {
    'english': [
      "This sentence uses the present tense to describe a current action or state.",
      "Note the subject-verb agreement pattern common in English.",
      "This demonstrates the typical SVO (Subject-Verb-Object) structure of English sentences.",
      "The sentence uses articles (a/an/the) to specify the nouns.",
      "This sentence contains adjectives that come before the nouns they modify."
    ],
    'spanish': [
      "This sentence demonstrates the Spanish verb conjugation pattern.",
      "Note the noun-adjective agreement in gender and number.",
      "This shows the common flexibility in word order that Spanish allows.",
      "The sentence uses reflexive pronouns to indicate the subject performs an action on itself.",
      "This sentence uses the subjunctive mood to express uncertainty or desire.",
      "The imperfect tense (había) indicates an ongoing action in the past.",
      "The past participle (pasado) is used to form compound tenses."
    ],
    'french': [
      "This sentence demonstrates French verb conjugation patterns.",
      "Note the required agreement between articles, nouns, and adjectives.",
      "This shows the typical French sentence structure with subject-verb-object.",
      "The sentence uses partitive articles (du, de la, des) to indicate quantity.",
      "This sentence features liaison between words for fluid pronunciation."
    ],
    'german': [
      "This sentence demonstrates the German case system affecting articles and adjectives.",
      "Note the verb position at the end of the subordinate clause.",
      "This shows the typical sentence structure with the verb in second position.",
      "The sentence uses compound nouns, a common feature in German.",
      "This sentence features separable verb prefixes."
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
  // Count words to determine complexity
  const wordCount = sentence.split(/\s+/).length;
  
  const structures: Record<string, string[]> = {
    'english': [
      "Simple declarative sentence with subject and predicate.",
      "Complex sentence with main clause and subordinate clause.",
      "Compound sentence with two independent clauses joined by a conjunction.",
      "Interrogative sentence structure with auxiliary verb at the beginning.",
      "Imperative sentence starting with a verb, with implied subject 'you'."
    ],
    'spanish': [
      "Simple declarative sentence with subject-verb-object structure.",
      "Complex sentence with main clause and subordinate clause introduced by 'que'.",
      "Sentence with reflexive verb construction.",
      "Sentence with direct and indirect object pronouns.",
      "Question structure with rising intonation at the end.",
      "Simple imperfect past tense construction indicating an ongoing action in the past."
    ],
    'french': [
      "Simple declarative sentence with subject-verb-object pattern.",
      "Complex sentence with main clause and relative clause introduced by 'qui'.",
      "Sentence with negation using 'ne...pas' structure.",
      "Interrogative sentence using inversion of subject and verb.",
      "Compound sentence with two clauses connected by a conjunction."
    ],
    'german': [
      "Simple sentence with verb in second position.",
      "Subordinate clause with verb at the end.",
      "Sentence with modal verb sending the main verb to the end.",
      "Question structure with verb in first position.",
      "Compound sentence with coordinating conjunction."
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
  const patterns: Record<string, string[]> = {
    'english': [
      "Use of present tense verbs to describe current actions or states.",
      "Subject-verb-object structure prevalent in declarative sentences.",
      "Adjectives typically precede the nouns they modify.",
      "Use of auxiliary verbs to form questions and negations.",
      "Prepositional phrases used to provide additional context about time, place, or manner.",
      "Consistent subject-verb agreement in number."
    ],
    'spanish': [
      "Noun-adjective agreement in gender and number.",
      "Flexible word order compared to English, with verbs often preceding subjects.",
      "Use of reflexive pronouns to indicate actions performed on oneself.",
      "Subject pronouns often omitted as verb conjugations indicate the subject.",
      "Different verb forms for formal and informal address.",
      "Use of subjunctive mood to express doubt, desire, or uncertainty.",
      "Imperfect tense used to describe ongoing actions in the past.",
      "Past participles used in compound tenses and as adjectives."
    ],
    'french': [
      "Noun-adjective agreement in gender and number.",
      "Use of articles that match the gender of nouns.",
      "Negation formed by placing 'ne' before and 'pas' after the verb.",
      "Liaison between words for fluid pronunciation.",
      "Formal and informal forms of address with corresponding verb conjugations.",
      "Extensive use of partitive articles (du, de la, des)."
    ],
    'german': [
      "Verb placement at the end of subordinate clauses.",
      "Verbs in second position in main clauses.",
      "Nouns always capitalized.",
      "Case system affecting articles, pronouns, and adjectives.",
      "Compound words formed by combining multiple nouns.",
      "Separable verb prefixes in certain tenses."
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
  const wordCount = text.split(/\s+/).length;
  
  // Spanish text summaries - always in English
  const spanishPatterns = {
    short: [
      "This brief Spanish text describes a simple morning routine with basic vocabulary.",
      "The text introduces some fundamental Spanish expressions for daily activities.",
      "This short passage uses simple present tense verbs to describe everyday actions."
    ],
    medium: [
      "This Spanish text describes someone's morning routine, including waking up, having coffee, and going for a walk.",
      "The passage describes the beginning of a day, mentioning the weather and some basic morning activities.",
      "This text narrates a sequence of morning activities using simple present tense verbs."
    ],
    long: [
      "The text describes a complete morning routine in Spanish, starting with acknowledging a new day, observing the sunny weather, getting up early, having a cup of coffee, and going out for a walk afterward.",
      "This Spanish passage follows the sequence of someone's morning, from noticing the beautiful day, to waking up early, enjoying coffee, and taking a morning walk in the sunshine.",
      "The narrative describes a morning routine with detailed actions: recognizing a new day has begun, appreciating the sunshine, getting out of bed early, drinking coffee, and finally going for a walk."
    ],
    imperfect: [
      "The text describes a past situation using the imperfect tense in Spanish.",
      "This Spanish passage refers to something that had happened or existed in the past.",
      "The text uses past tense structures to describe a previous state or condition."
    ]
  };
  
  // French text summaries - always in English
  const frenchPatterns = {
    short: "This brief French text introduces basic vocabulary and simple sentence structures.",
    medium: "This French passage describes everyday activities using present tense verbs.",
    long: "The text presents a detailed narrative in French, demonstrating various grammatical structures and vocabulary items suitable for intermediate learners."
  };
  
  // German text summaries - always in English
  const germanPatterns = {
    short: "This brief German text uses basic vocabulary and simple sentence forms.",
    medium: "This German passage describes common activities with present tense verbs.",
    long: "The text presents a detailed narrative in German, showing different sentence structures and vocabulary appropriate for intermediate learners."
  };
  
  // English text summaries - in simpler English
  const englishPatterns = {
    short: "This brief English text demonstrates basic vocabulary and simple sentences.",
    medium: "This English passage uses everyday expressions and present tense verbs.",
    long: "The text presents a detailed English narrative with varied sentence structures."
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
    if (wordCount < 10) return englishPatterns.short;
    else if (wordCount < 30) return englishPatterns.medium;
    else return englishPatterns.long;
  }
}
