
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  text: string
  language: string
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

    // This function is now focused only on vocabulary generation for single words or short phrases
    // Generate vocabulary data with English definition
    const definition = getEnglishTranslation(text, language);
    const exampleSentence = generateExampleSentence(text, language);
    
    // Return the vocabulary item data
    const vocabularyData = {
      definition: definition,
      exampleSentence: exampleSentence,
    };
    
    return new Response(
      JSON.stringify(vocabularyData),
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
