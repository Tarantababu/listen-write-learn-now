
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  text: string
  language: string
}

interface Word {
  word: string
  definition: string
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
  summary: string
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
      // Generate more realistic vocabulary data for the word/phrase
      const vocabularyData = {
        definition: `${text} - ${generateDefinition(text, language)}`,
        exampleSentence: generateExampleSentence(text, language),
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
      summary: generateDetailedSummary(text, language)
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

// Helper functions to generate more realistic vocabulary items
function generateDefinition(word: string, language: string): string {
  const definitions: Record<string, Record<string, string>> = {
    'english': {
      'simple': 'Easy to understand or use, not complicated.',
      'powerful': 'Having great power, influence, or effectiveness.',
      'read': 'To look at and understand the meaning of written or printed words.',
      'book': 'A set of printed or written pages bound together along one edge.',
      'walk': 'To move at a regular pace by lifting and setting down each foot in turn.',
      'default': 'Easy to understand or use, yet effective and meaningful.'
    },
    'spanish': {
      'hablar': 'Expresar ideas o sentimientos con palabras.',
      'leer': 'Interpretar el significado de letras y palabras escritas.',
      'libro': 'Conjunto de hojas impresas unidas por un lado.',
      'caminar': 'Moverse dando pasos.',
      'día': 'Periodo de 24 horas, especialmente de la mañana a la noche.',
      'default': 'Término con significado específico en el idioma español.'
    },
    'french': {
      'parler': 'Exprimer des pensées par la parole.',
      'lire': 'Prendre connaissance du contenu d\'un texte.',
      'livre': 'Assemblage de feuilles imprimées et reliées ensemble.',
      'marcher': 'Se déplacer par mouvements successifs des jambes et des pieds.',
      'jour': 'Espace de temps de 24 heures.',
      'default': 'Un mot ou une phrase avec une signification spécifique en français.'
    },
    'german': {
      'sprechen': 'Gedanken mündlich ausdrücken.',
      'lesen': 'Geschriebenen Text erfassen und verstehen.',
      'buch': 'Gebundene Sammlung von bedruckten Blättern.',
      'gehen': 'Sich zu Fuß fortbewegen.',
      'tag': 'Zeitraum von 24 Stunden.',
      'default': 'Ein Wort oder eine Phrase mit einer spezifischen Bedeutung auf Deutsch.'
    }
  };
  
  const cleanWord = word.toLowerCase().trim();
  const languageDict = definitions[language] || definitions['english'];
  
  return languageDict[cleanWord] || languageDict['default'];
}

function generateExampleSentence(word: string, language: string): string {
  const templates: Record<string, string[]> = {
    'english': [
      'The teacher explained the concept in a __WORD__ way.',
      'I really enjoy reading this __WORD__ book.',
      'She demonstrated her __WORD__ skills during the presentation.',
      'This __WORD__ approach will help us solve the problem.',
      'The __WORD__ design of the app makes it easy to use.'
    ],
    'spanish': [
      'El profesor explicó el concepto de manera __WORD__.',
      'Me gusta mucho leer este libro __WORD__.',
      'Ella demostró sus habilidades __WORD__ durante la presentación.',
      'Este enfoque __WORD__ nos ayudará a resolver el problema.',
      'El diseño __WORD__ de la aplicación la hace fácil de usar.'
    ],
    'french': [
      'Le professeur a expliqué le concept d\'une manière __WORD__.',
      'J\'aime beaucoup lire ce livre __WORD__.',
      'Elle a démontré ses compétences __WORD__ pendant la présentation.',
      'Cette approche __WORD__ nous aidera à résoudre le problème.',
      'La conception __WORD__ de l\'application la rend facile à utiliser.'
    ],
    'german': [
      'Der Lehrer erklärte das Konzept auf eine __WORD__ Weise.',
      'Ich lese gerne dieses __WORD__ Buch.',
      'Sie zeigte ihre __WORD__ Fähigkeiten während der Präsentation.',
      'Dieser __WORD__ Ansatz wird uns helfen, das Problem zu lösen.',
      'Das __WORD__ Design der App macht sie einfach zu bedienen.'
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
    .filter((w) => w.length > 2)
    .slice(0, 3)
  
  const languageRoots: Record<string, string[]> = {
    'english': ['Old English', 'Latin', 'Greek', 'French', 'German'],
    'spanish': ['Latin', 'Arabic', 'Greek', 'Celtic', 'Gothic'],
    'french': ['Latin', 'Frankish', 'Celtic', 'Greek', 'Germanic'],
    'german': ['Old High German', 'Latin', 'French', 'Greek', 'Proto-Germanic']
  };
  
  const roots = languageRoots[language] || languageRoots['english'];
  
  return words.map((word) => {
    const cleanWord = word.replace(/[,.;:!?()\[\]{}""]/g, '').toLowerCase()
    const randomRoot = roots[Math.floor(Math.random() * roots.length)];
    
    return {
      word: cleanWord,
      definition: generateDefinition(cleanWord, language),
      etymologyInsight: `From ${randomRoot}, meaning related to "${cleanWord}" in its original form.`,
      englishCousin: generateEnglishCousin(cleanWord)
    }
  })
}

function generateEnglishCousin(word: string): string {
  const similarWords: Record<string, string> = {
    // Spanish cousins
    'libro': 'library',
    'hablar': 'habitat',
    'sol': 'solar',
    'luna': 'lunar',
    'tiempo': 'temporal',
    'agua': 'aquatic',
    'fuego': 'fuel',
    'tierra': 'terrestrial',
    // French cousins
    'livre': 'library',
    'parler': 'parliament',
    'soleil': 'solar',
    'lune': 'lunar',
    'temps': 'temporal',
    'eau': 'aquatic',
    'feu': 'fuel',
    'terre': 'terrestrial',
    // German cousins
    'buch': 'book',
    'sprechen': 'speak',
    'sonne': 'sun',
    'mond': 'moon',
    'zeit': 'time',
    'wasser': 'water',
    'feuer': 'fire',
    'erde': 'earth'
  };
  
  return similarWords[word] || word;
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
      "This sentence uses the subjunctive mood to express uncertainty or desire."
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
      "Question structure with rising intonation at the end."
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
      "Use of subjunctive mood to express doubt, desire, or uncertainty."
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

function generateDetailedSummary(text: string, language: string): string {
  // Simply generate a generic summary based on text length
  const wordCount = text.split(/\s+/).length;
  
  if (wordCount < 10) {
    return `This is a brief ${language} text showing simple sentence structure and basic vocabulary.`;
  } else if (wordCount < 30) {
    return `This ${language} text demonstrates several grammatical structures and vocabulary items suitable for beginner to intermediate learners.`;
  } else {
    return `This longer ${language} passage incorporates a variety of sentence structures, verb tenses, and vocabulary that showcases important patterns in the language. It provides excellent practice for intermediate to advanced learners.`;
  }
}
