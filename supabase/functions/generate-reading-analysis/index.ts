import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  text: string
  language: string
}

interface Word {
  word: string
  definition: string
  exampleSentence: string
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
  englishTranslation: string
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

    console.log(`Generating reading analysis for "${text.substring(0, 20)}..." in ${language}`)

    // For reading analysis, we create a comprehensive breakdown of the text
    // Split the text into sentences (improved sentence splitting)
    const rawSentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
    
    // Generate English translation for non-English texts
    let englishTranslation = null;
    if (language !== 'english') {
      englishTranslation = translateToEnglish(text, language);
    }
    
    // Create a full analysis
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
      summary: generateEnglishSummary(text, language),
      englishTranslation: englishTranslation
    }

    return new Response(
      JSON.stringify({ analysis }),
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

// Helper function to generate detailed words analysis
function generateDetailedWords(sentence: string, language: string): Word[] {
  const words = sentence
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map(w => w.replace(/[,.;:!?()\[\]{}""]/g, '').toLowerCase())
    .slice(0, 5) // Take up to 5 key words for analysis
  
  return words.map((word) => {
    const cleanWord = word.replace(/[,.;:!?()\[\]{}""]/g, '').toLowerCase()
    const definition = getEnglishTranslation(cleanWord, language)
    const exampleSentence = generateExampleSentence(cleanWord, language)
    
    return {
      word: cleanWord,
      definition: definition,
      exampleSentence: exampleSentence
    }
  })
}

// Helper function for grammar insights
function generateDetailedGrammarInsights(sentence: string, language: string): string[] {
  // Grammar insights tailored for CEFR A1-A2 level learners
  const insights: Record<string, string[]> = {
    'english': [
      "This sentence uses the present simple tense which is used for facts, habits, and regular actions.",
      "The sentence demonstrates the Subject-Verb-Object structure which is the most common pattern in English.",
      "Notice how articles (a/an/the) are used before nouns to indicate whether the noun is specific or general.",
      "This sentence contains adjectives positioned before the nouns they modify, which is standard in English.",
      "The sentence uses adverbs to provide more information about the verb, describing how, when, or where the action occurs.",
      "This shows how English uses auxiliary verbs to form questions and negative statements.",
      "The sentence demonstrates how English uses prepositions to show relationships between words in terms of time, location, or direction.",
      "This is an example of a compound sentence with two independent clauses joined by a coordinating conjunction.",
      "The sentence shows how English uses the past tense form by typically adding '-ed' to regular verbs or using irregular forms."
    ],
    'spanish': [
      "This sentence demonstrates Spanish verb conjugation where the ending changes based on the subject.",
      "Notice how Spanish requires noun-adjective agreement in both gender and number, with adjectives typically following the nouns.",
      "This shows the common flexibility in word order that Spanish allows, particularly with subject placement.",
      "The sentence uses reflexive pronouns (me, te, se, nos, os) to indicate that the subject performs an action on itself.",
      "This demonstrates how Spanish often omits subject pronouns since the verb conjugation already indicates the subject.",
      "The sentence shows how Spanish uses the personal 'a' before direct objects that are people.",
      "This is an example of how Spanish uses gustar-type verbs where the grammatical subject is actually the thing being liked."
    ],
    'french': [
      "This sentence demonstrates French verb conjugation where endings change according to the subject.",
      "Notice the required agreement between articles, nouns, and adjectives in both gender and number.",
      "The sentence shows the typical subject-verb-object structure of French.",
      "This demonstrates how French uses partitive articles (du, de la, des) to indicate an unspecified quantity.",
      "This shows how French uses reflexive verbs (se lever, se laver) more extensively than English.",
      "The sentence demonstrates how French uses different verb forms for formal (vous) and informal (tu) address.",
      "This is an example of how French often places adverbs after the verb rather than before it."
    ],
    'german': [
      "This sentence demonstrates how German places the verb in second position in main clauses.",
      "Notice how German uses a case system (nominative, accusative, dative, genitive) that affects articles and adjectives.",
      "This demonstrates how German capitalizes all nouns, making them easier to identify in a sentence.",
      "The sentence features compound nouns, where multiple words are joined together to create a single noun.",
      "This shows how German separable verbs split in conjugated forms, with the prefix moving to the end.",
      "The sentence demonstrates the use of modal verbs which send the main verb to the end of the clause.",
      "This is an example of how German often uses the dative case for indirect objects and after certain prepositions."
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

// Helper function for sentence structure analysis
function generateDetailedStructure(sentence: string, language: string): string {
  // Sentence structure analysis focused on CEFR A1-A2 level
  const wordCount = sentence.split(/\s+/).length;
  
  const structures: Record<string, string[]> = {
    'english': [
      "Simple declarative sentence with subject (noun) + predicate (verb + object).",
      "Complex sentence with main clause and subordinate clause introduced by a conjunction.",
      "Compound sentence with two independent clauses joined by a coordinating conjunction.",
      "Interrogative sentence structure with auxiliary verb before the subject.",
      "Imperative sentence starting with a base-form verb, with implied subject 'you'.",
      "Sentence with adjective modifiers before the noun.",
      "Sentence with adverbs modifying verbs, showing how, when, or where."
    ],
    'spanish': [
      "Simple declarative sentence with flexible subject-verb-object structure.",
      "Complex sentence with main clause and subordinate clause introduced by 'que'.",
      "Sentence with reflexive verb construction where the subject performs an action on itself.",
      "Sentence with direct and indirect object pronouns before the verb.",
      "Question structure with rising intonation at the end or interrogative words.",
      "Sentence with adjectives after the nouns they modify.",
      "Sentence using the present tense to express current facts or habits."
    ],
    'french': [
      "Simple declarative sentence with subject-verb-object pattern.",
      "Complex sentence with main clause and relative clause introduced by 'qui' or 'que'.",
      "Sentence with negation using 'ne...pas' structure surrounding the verb.",
      "Interrogative sentence using inversion of subject and verb or 'est-ce que'.",
      "Sentence with adjectives that may come before or after nouns depending on the adjective.",
      "Sentence showing object pronouns placed before the verb.",
      "Sentence with adverbs typically placed after the verb they modify."
    ],
    'german': [
      "Simple sentence with verb in second position.",
      "Sentence with modal verb sending the main verb to the end in infinitive form.",
      "Question structure with verb in first position.",
      "Sentence showing case markers on articles and adjectives.",
      "Sentence with separable prefix verb where the prefix moves to the end.",
      "Compound sentence with coordinating conjunction maintaining verb second position.",
      "Sentence demonstrating the use of the dative case for indirect objects."
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

// Helper function for identifying language patterns
function generateDetailedPatterns(language: string, fullText: string): string[] {
  // Extract an example phrase from the text
  const textWords = fullText.split(/\s+/);
  const randomWordIndex = Math.floor(Math.random() * Math.max(textWords.length - 5, 1));
  const examplePhrase = textWords.slice(randomWordIndex, randomWordIndex + Math.min(5, textWords.length - randomWordIndex)).join(' ');
  
  const patterns: Record<string, string[]> = {
    'english': [
      `Use of present tense verbs to describe current actions or states. Example: "${examplePhrase}"`,
      "Subject-verb-object structure prevalent in declarative sentences.",
      "Adjectives typically precede the nouns they modify, unlike in many Romance languages.",
      "English uses auxiliary verbs (do, have, be) to form questions and negations.",
      "Prepositional phrases provide additional context about time, place, or manner.",
      "English maintains consistent subject-verb agreement in number.",
      "English articles (a, an, the) indicate whether a noun is specific or general.",
      "Modals (can, should, will, must) express necessity, possibility, permission, or future time."
    ],
    'spanish': [
      `Noun-adjective agreement in gender and number is essential. Example: "${examplePhrase}"`,
      "Spanish allows more flexible word order than English, often placing verbs before subjects.",
      "Use of reflexive pronouns (me, te, se) to indicate actions performed on oneself.",
      "Subject pronouns are frequently omitted since verb conjugations clearly indicate who performs the action.",
      "Spanish uses different verb forms for formal (usted) and informal (tú) address.",
      "The personal 'a' is used before direct objects that are specific people.",
      "Verbs change their endings depending on who is performing the action (yo, tú, él/ella, etc.)."
    ],
    'french': [
      `Noun-adjective agreement in gender and number is mandatory. Example: "${examplePhrase}"`,
      "Articles must match the gender of the nouns they precede, with masculine 'le/un' and feminine 'la/une'.",
      "Negation is formed by placing 'ne' before and 'pas' after the verb.",
      "French uses formal (vous) and informal (tu) forms of address.",
      "Partitive articles (du, de la, des) indicate an unspecified quantity of something.",
      "Most adjectives follow the nouns they modify, unlike in English.",
      "Question formation can use simple inversion, 'est-ce que' construction, or just rising intonation."
    ],
    'german': [
      `Verb placement at the end of subordinate clauses. Example: "${examplePhrase}"`,
      "In main clauses, the conjugated verb must appear in the second position.",
      "All nouns are capitalized, making them easily identifiable in written text.",
      "The case system (nominative, accusative, dative, genitive) affects articles and adjective endings.",
      "Compound words are formed by combining multiple nouns into a single word.",
      "Separable verb prefixes detach and move to the end of the clause when the verb is conjugated.",
      "German has three grammatical genders (masculine, feminine, neuter)."
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

// Helper function to generate English summary
function generateEnglishSummary(text: string, language: string): string {
  // Generate a clear English summary based on the text content
  // For English texts, provide a simpler explanation
  if (language === 'english') {
    return `This text explains everyday activities in simple English. It describes ${guessContentFromLanguage(text, 'english')}.`;
  }
  
  const wordCount = text.split(/\s+/).length;
  
  // Text summaries based on language and length
  const spanishPatterns = {
    short: [
      "This brief Spanish text describes a simple situation with basic vocabulary suitable for beginners.",
      "The passage introduces fundamental Spanish expressions using simple present tense verbs.",
      "This short Spanish text demonstrates basic sentence structures and common vocabulary."
    ],
    medium: [
      "This Spanish text describes someone's activities, using present tense verbs and reflexive pronouns common in daily descriptions.",
      "The passage narrates events in Spanish, mentioning observations and activities with a natural flow between related actions.",
      "This text shows a sequence of activities in Spanish using time-related transition words and consistent verb tenses."
    ],
    long: [
      "The Spanish text describes a complete situation, demonstrating how Spanish uses reflexive verbs for personal actions and employs connecting phrases to create a logical sequence of events.",
      "This Spanish passage follows someone's activities chronologically, showcasing how Spanish expresses time relationships and personal activities using appropriate verb forms and prepositions.",
      "The narrative describes detailed actions in Spanish, illustrating how native speakers typically express activities using reflexive verbs, time expressions, and location phrases."
    ]
  };
  
  // French text summaries
  const frenchPatterns = {
    short: "This brief French text introduces basic vocabulary and simple sentence structures ideal for beginning learners.",
    medium: "This French passage describes everyday activities using present tense verbs and common vocabulary, demonstrating how French expresses routine actions.",
    long: "The text presents a detailed narrative in French, demonstrating various grammatical structures including verb tenses, pronoun usage, and idiomatic expressions."
  };
  
  // German text summaries
  const germanPatterns = {
    short: "This brief German text uses basic vocabulary and simple sentence forms with verbs in the second position.",
    medium: "This German passage describes common activities while demonstrating key features of German grammar, including verb position rules and case usage.",
    long: "The text presents a detailed narrative in German, showcasing different sentence structures including main and subordinate clauses with their distinct verb positioning."
  };
  
  if (language === 'spanish') {
    if (wordCount < 10) {
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

// Helper function to translate text to English
function translateToEnglish(text: string, language: string): string {
  // Simple translation function for demo purposes
  // In a production environment, this would use a proper translation API
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
      "Why did he decide to do it?"
  };
  
  const frenchTexts = {
    "Aujourd'hui est un nouveau jour. Le soleil brille dans le ciel.":
      "Today is a new day. The sun is shining in the sky.",
    "Je me lève tôt. Je prends une tasse de café. Puis je sors me promener.":
      "I get up early. I have a cup of coffee. Then I go out for a walk.",
    "L'homme invite la femme.":
      "The man invites the woman."
  };
  
  const germanTexts = {
    "Heute ist ein neuer Tag. Die Sonne scheint am Himmel.":
      "Today is a new day. The sun is shining in the sky.",
    "Ich stehe früh auf. Ich trinke eine Tasse Kaffee. Dann gehe ich spazieren.":
      "I get up early. I drink a cup of coffee. Then I go for a walk.",
    "Der Mann lädt die Frau ein.":
      "The man invites the woman."
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
  return `[English translation of the ${language} text. In a production environment, this would be a professional translation.]`;
}

// Helper function to guess content
function guessContentFromLanguage(text: string, language: string): string {
  // Analyze the text content based on common keywords
  const lowercaseText = text.toLowerCase();
  
  if (lowercaseText.includes('hello') || lowercaseText.includes('hi') || 
      lowercaseText.includes('morning') || lowercaseText.includes('afternoon')) {
    return 'greetings and introductions';
  } else if (lowercaseText.includes('eat') || lowercaseText.includes('food') || 
            lowercaseText.includes('drink') || lowercaseText.includes('meal')) {
    return 'food and eating habits';
  } else if (lowercaseText.includes('time') || lowercaseText.includes('clock') || 
            lowercaseText.includes('hour') || lowercaseText.includes('minute')) {
    return 'telling time and daily schedule';
  } else if (lowercaseText.includes('house') || lowercaseText.includes('room') || 
            lowercaseText.includes('kitchen') || lowercaseText.includes('bathroom')) {
    return 'home and living spaces';
  } else if (lowercaseText.includes('walk') || lowercaseText.includes('go') || 
            lowercaseText.includes('travel') || lowercaseText.includes('visit')) {
    return 'movement and travel';
  } else if (lowercaseText.includes('friend') || lowercaseText.includes('family') || 
            lowercaseText.includes('mother') || lowercaseText.includes('father')) {
    return 'family and relationships';
  } else if (lowercaseText.includes('work') || lowercaseText.includes('job') || 
            lowercaseText.includes('study') || lowercaseText.includes('school')) {
    return 'work and education';
  } else {
    return 'everyday activities and situations';
  }
}

// Helper function for vocabulary definitions
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
    // Try the whole phrase first with specific phrase matches
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

// Helper function for example sentences
function generateExampleSentence(word: string, language: string): string {
  const templates: Record<string, string[]> = {
    'english': [
      'The teacher explained the word "__WORD__" to the students.',
      'I use "__WORD__" in my daily conversation.',
      'She reads about "__WORD__" in her textbook.',
      'He practices using "__WORD__" when speaking.',
      'We learned about "__WORD__" in our lesson today.'
    ],
    'spanish': [
      'Uso "__WORD__" cuando hablo con mis amigos.',
      'La profesora explica "__WORD__" en la clase.',
      'Me gusta estudiar la palabra "__WORD
