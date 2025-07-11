import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { difficulty_level, language, exercise_type, session_id } = await req.json()

    console.log('Generating exercise for target language:', language, 'difficulty:', difficulty_level, 'type:', exercise_type)

    // Get user's known words for this language
    const { data: knownWords } = await supabaseClient
      .from('known_words')
      .select('word, mastery_level')
      .eq('user_id', user.id)
      .eq('language', language)

    const knownWordSet = new Set(knownWords?.map(w => w.word.toLowerCase()) || [])

    // Generate exercise based on difficulty and known words
    const exercise = await generateExercise(
      difficulty_level,
      language,
      exercise_type,
      knownWordSet,
      session_id
    )

    return new Response(
      JSON.stringify(exercise),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error generating sentence mining exercise:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function generateExercise(
  difficulty: string,
  language: string,
  exerciseType: string,
  knownWords: Set<string>,
  sessionId: string
) {
  // Get language-appropriate sentences based on the selected language
  const sentences = getSampleSentences(difficulty, language)
  
  // Find a sentence with the right number of unknown words (n+1 methodology)
  const targetUnknownWords = getTargetUnknownWords(difficulty)
  
  for (const sentence of sentences) {
    const words = extractWords(sentence.targetText)
    const unknownWords = words.filter(word => !knownWords.has(word.toLowerCase()))
    
    if (unknownWords.length >= targetUnknownWords && unknownWords.length <= targetUnknownWords + 2) {
      const targetWord = unknownWords[0] || words[0] // Ensure we have a target word
      
      const baseExercise = {
        id: crypto.randomUUID(),
        sessionId,
        exerciseType,
        sentence: sentence.targetText,
        translation: sentence.englishText,
        targetWords: unknownWords.slice(0, targetUnknownWords),
        unknownWords: unknownWords,
        difficultyScore: calculateDifficultyScore(unknownWords.length, words.length),
        explanation: `Focus on learning: ${unknownWords.slice(0, targetUnknownWords).join(', ')}`,
        hints: generateHints(unknownWords.slice(0, targetUnknownWords), sentence.englishText)
      }

      // Add exercise-specific properties
      if (exerciseType === 'multiple_choice') {
        return {
          ...baseExercise,
          multipleChoiceOptions: generateMultipleChoiceOptions(targetWord, language),
          correctAnswer: getCorrectTranslation(targetWord, language)
        }
      } else if (exerciseType === 'cloze') {
        return {
          ...baseExercise,
          clozeSentence: generateClozeSentence(sentence.targetText, targetWord)
        }
      }
      
      return baseExercise
    }
  }
  
  // Fallback to first available sentence if no perfect match
  const fallbackSentence = sentences[0]
  const words = extractWords(fallbackSentence.targetText)
  const unknownWords = words.filter(word => !knownWords.has(word.toLowerCase()))
  const targetWord = unknownWords[0] || words[0] // Ensure we have a target word
  
  const baseExercise = {
    id: crypto.randomUUID(),
    sessionId,
    exerciseType,
    sentence: fallbackSentence.targetText,
    translation: fallbackSentence.englishText,
    targetWords: unknownWords.slice(0, Math.min(targetUnknownWords, unknownWords.length)),
    unknownWords: unknownWords,
    difficultyScore: calculateDifficultyScore(unknownWords.length, words.length),
    explanation: `Focus on learning: ${unknownWords.slice(0, Math.min(targetUnknownWords, unknownWords.length)).join(', ')}`,
    hints: generateHints(unknownWords.slice(0, Math.min(targetUnknownWords, unknownWords.length)), fallbackSentence.englishText)
  }

  // Add exercise-specific properties for fallback
  if (exerciseType === 'multiple_choice') {
    return {
      ...baseExercise,
      multipleChoiceOptions: generateMultipleChoiceOptions(targetWord, language),
      correctAnswer: getCorrectTranslation(targetWord, language)
    }
  } else if (exerciseType === 'cloze') {
    return {
      ...baseExercise,
      clozeSentence: generateClozeSentence(fallbackSentence.targetText, targetWord)
    }
  }
  
  return baseExercise
}

function generateMultipleChoiceOptions(targetWord: string, language: string): string[] {
  // Generate plausible wrong answers based on language
  const correctAnswer = getCorrectTranslation(targetWord, language)
  const wrongAnswers = getWrongAnswers(targetWord, language)
  
  // Combine and shuffle
  const allOptions = [correctAnswer, ...wrongAnswers]
  return shuffleArray(allOptions)
}

function getCorrectTranslation(word: string, language: string): string {
  // Simple translation mapping for common words
  const translations: Record<string, Record<string, string>> = {
    german: {
      'die': 'the (feminine)',
      'der': 'the (masculine)', 
      'das': 'the (neuter)',
      'katze': 'cat',
      'sitzt': 'sits',
      'auf': 'on',
      'dem': 'the (dative)',
      'stuhl': 'chair',
      'ich': 'I',
      'esse': 'eat',
      'gerne': 'gladly/like to',
      'äpfel': 'apples',
      'buch': 'book',
      'liegt': 'lies',
      'tisch': 'table',
      'sie': 'she/they',
      'trinkt': 'drinks',
      'jeden': 'every',
      'tag': 'day',
      'wasser': 'water',
      'sonne': 'sun',
      'scheint': 'shines',
      'heute': 'today',
      'hell': 'bright'
    },
    spanish: {
      'el': 'the (masculine)',
      'la': 'the (feminine)',
      'gato': 'cat',
      'se': 'reflexive pronoun',
      'sienta': 'sits',
      'en': 'in/on',
      'silla': 'chair',
      'me': 'me',
      'gusta': 'like',
      'comer': 'to eat',
      'manzanas': 'apples',
      'libro': 'book',
      'está': 'is',
      'mesa': 'table',
      'ella': 'she',
      'bebe': 'drinks',
      'agua': 'water',
      'todos': 'all',
      'los': 'the (plural)',
      'días': 'days',
      'sol': 'sun',
      'brilla': 'shines',
      'hoy': 'today'
    },
    french: {
      'le': 'the (masculine)',
      'la': 'the (feminine)',
      'chat': 'cat',
      's\'assoit': 'sits',
      'sur': 'on',
      'chaise': 'chair',
      'j\'aime': 'I like',
      'manger': 'to eat',
      'des': 'some',
      'pommes': 'apples',
      'livre': 'book',
      'est': 'is',
      'table': 'table',
      'elle': 'she',
      'boit': 'drinks',
      'de': 'of',
      'l\'eau': 'water',
      'tous': 'all',
      'les': 'the (plural)',
      'jours': 'days',
      'soleil': 'sun',
      'brille': 'shines',
      'aujourd\'hui': 'today'
    }
  }

  return translations[language]?.[word.toLowerCase()] || `${word} (translation)`
}

function getWrongAnswers(word: string, language: string): string[] {
  // Generate plausible but incorrect translations
  const wrongAnswerPool = [
    'house', 'dog', 'run', 'big', 'small', 'green', 'blue', 'happy', 'sad',
    'book', 'pen', 'door', 'window', 'car', 'tree', 'flower', 'bird', 'fish'
  ]
  
  // Remove the correct answer if it's in the pool
  const correctAnswer = getCorrectTranslation(word, language)
  const filtered = wrongAnswerPool.filter(answer => 
    !correctAnswer.toLowerCase().includes(answer.toLowerCase())
  )
  
  // Return 3 random wrong answers
  return shuffleArray(filtered).slice(0, 3)
}

function generateClozeSentence(sentence: string, targetWord: string): string {
  // Replace the target word with a blank
  const words = sentence.split(' ')
  const targetIndex = words.findIndex(word => 
    word.toLowerCase().includes(targetWord.toLowerCase())
  )
  
  if (targetIndex !== -1) {
    words[targetIndex] = '___'
  }
  
  return words.join(' ')
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getTargetUnknownWords(difficulty: string): number {
  switch (difficulty) {
    case 'beginner': return 1
    case 'intermediate': return 2
    case 'advanced': return 3
    default: return 1
  }
}

function extractWords(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0)
}

function calculateDifficultyScore(unknownWords: number, totalWords: number): number {
  return Math.round((unknownWords / totalWords) * 100)
}

function generateHints(targetWords: string[], translation: string): string[] {
  return targetWords.map(word => 
    `The word "${word}" appears in the translation: "${translation}"`
  )
}

function getSampleSentences(difficulty: string, language: string) {
  // Updated structure to have targetText (target language) and englishText (English translation)
  const sentencesData = {
    german: {
      beginner: [
        { targetText: 'Die Katze sitzt auf dem Stuhl.', englishText: 'The cat sits on the chair.' },
        { targetText: 'Ich esse gerne Äpfel.', englishText: 'I like to eat apples.' },
        { targetText: 'Das Buch liegt auf dem Tisch.', englishText: 'The book is on the table.' },
        { targetText: 'Sie trinkt jeden Tag Wasser.', englishText: 'She drinks water every day.' },
        { targetText: 'Die Sonne scheint heute hell.', englishText: 'The sun is shining bright today.' }
      ],
      intermediate: [
        { targetText: 'Die Wettervorhersage sagt morgen Regen voraus.', englishText: 'The weather forecast predicts rain tomorrow.' },
        { targetText: 'Ich muss meine Hausaufgaben vor dem Abendessen beenden.', englishText: 'I need to finish my homework before dinner.' },
        { targetText: 'Das Konzert wurde wegen schlechten Wetters abgesagt.', englishText: 'The concert was cancelled due to bad weather.' },
        { targetText: 'Sie liest gerne Kriminalromane in ihrer Freizeit.', englishText: 'She enjoys reading mystery novels in her free time.' },
        { targetText: 'Das Restaurant serviert köstliche traditionelle Küche.', englishText: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { targetText: 'Die archäologische Expedition entdeckte antike Artefakte.', englishText: 'The archaeological expedition uncovered ancient artifacts.' },
        { targetText: 'Wirtschaftliche Schwankungen beeinflussen internationale Handelsmuster.', englishText: 'Economic fluctuations affect international trade patterns.' },
        { targetText: 'Das Pharmaunternehmen entwickelte innovative Behandlungen.', englishText: 'The pharmaceutical company developed innovative treatments.' },
        { targetText: 'Umweltschutz erfordert umfassende politische Veränderungen.', englishText: 'Environmental sustainability requires comprehensive policy changes.' },
        { targetText: 'Der technologische Fortschritt revolutionierte die Kommunikationsmethoden.', englishText: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    spanish: {
      beginner: [
        { targetText: 'El gato se sienta en la silla.', englishText: 'The cat sits on the chair.' },
        { targetText: 'Me gusta comer manzanas.', englishText: 'I like to eat apples.' },
        { targetText: 'El libro está en la mesa.', englishText: 'The book is on the table.' },
        { targetText: 'Ella bebe agua todos los días.', englishText: 'She drinks water every day.' },
        { targetText: 'El sol brilla hoy.', englishText: 'The sun is shining today.' }
      ],
      intermediate: [
        { targetText: 'El pronóstico del tiempo predice lluvia mañana.', englishText: 'The weather forecast predicts rain tomorrow.' },
        { targetText: 'Necesito terminar mi tarea antes de la cena.', englishText: 'I need to finish my homework before dinner.' },
        { targetText: 'El concierto fue cancelado debido al mal tiempo.', englishText: 'The concert was cancelled due to bad weather.' },
        { targetText: 'A ella le gusta leer novelas de misterio en su tiempo libre.', englishText: 'She enjoys reading mystery novels in her free time.' },
        { targetText: 'El restaurante sirve deliciosa cocina tradicional.', englishText: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { targetText: 'La expedición arqueológica descubrió artefactos antiguos.', englishText: 'The archaeological expedition uncovered ancient artifacts.' },
        { targetText: 'Las fluctuaciones económicas afectan los patrones de comercio internacional.', englishText: 'Economic fluctuations affect international trade patterns.' },
        { targetText: 'La empresa farmacéutica desarrolló tratamientos innovadores.', englishText: 'The pharmaceutical company developed innovative treatments.' },
        { targetText: 'La sostenibilidad ambiental requiere cambios políticos integrales.', englishText: 'Environmental sustainability requires comprehensive policy changes.' },
        { targetText: 'El avance tecnológico revolucionó los métodos de comunicación.', englishText: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    french: {
      beginner: [
        { targetText: 'Le chat s\'assoit sur la chaise.', englishText: 'The cat sits on the chair.' },
        { targetText: 'J\'aime manger des pommes.', englishText: 'I like to eat apples.' },
        { targetText: 'Le livre est sur la table.', englishText: 'The book is on the table.' },
        { targetText: 'Elle boit de l\'eau tous les jours.', englishText: 'She drinks water every day.' },
        { targetText: 'Le soleil brille aujourd\'hui.', englishText: 'The sun is shining today.' }
      ],
      intermediate: [
        { targetText: 'Les prévisions météorologiques prévoient de la pluie demain.', englishText: 'The weather forecast predicts rain tomorrow.' },
        { targetText: 'Je dois finir mes devoirs avant le dîner.', englishText: 'I need to finish my homework before dinner.' },
        { targetText: 'Le concert a été annulé à cause du mauvais temps.', englishText: 'The concert was cancelled due to bad weather.' },
        { targetText: 'Elle aime lire des romans policiers pendant son temps libre.', englishText: 'She enjoys reading mystery novels in her free time.' },
        { targetText: 'Le restaurant sert une délicieuse cuisine traditionnelle.', englishText: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { targetText: 'L\'expédition archéologique a découvert des artefacts anciens.', englishText: 'The archaeological expedition uncovered ancient artifacts.' },
        { targetText: 'Les fluctuations économiques affectent les modèles de commerce international.', englishText: 'Economic fluctuations affect international trade patterns.' },
        { targetText: 'L\'entreprise pharmaceutique a développé des traitements innovants.', englishText: 'The pharmaceutical company developed innovative treatments.' },
        { targetText: 'La durabilité environnementale nécessite des changements politiques complets.', englishText: 'Environmental sustainability requires comprehensive policy changes.' },
        { targetText: 'L\'avancement technologique a révolutionné les méthodes de communication.', englishText: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    turkish: {
      beginner: [
        { targetText: 'Kedi sandalyede oturuyor.', englishText: 'The cat sits on the chair.' },
        { targetText: 'Elma yemeyi seviyorum.', englishText: 'I like to eat apples.' },
        { targetText: 'Kitap masanın üzerinde.', englishText: 'The book is on the table.' },
        { targetText: 'O her gün su içer.', englishText: 'She drinks water every day.' },
        { targetText: 'Güneş bugün parlıyor.', englishText: 'The sun is shining today.' }
      ],
      intermediate: [
        { targetText: 'Hava durumu yarın yağmur öngörüyor.', englishText: 'The weather forecast predicts rain tomorrow.' },
        { targetText: 'Akşam yemeğinden önce ödevimi bitirmem gerekiyor.', englishText: 'I need to finish my homework before dinner.' },
        { targetText: 'Konser kötü hava nedeniyle iptal edildi.', englishText: 'The concert was cancelled due to bad weather.' },
        { targetText: 'Boş zamanlarında polisiye roman okumayı seviyor.', englishText: 'She enjoys reading mystery novels in her free time.' },
        { targetText: 'Restoran lezzetli geleneksel yemekler sunuyor.', englishText: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { targetText: 'Arkeolojik keşif ekibi antik eserler buldu.', englishText: 'The archaeological expedition uncovered ancient artifacts.' },
        { targetText: 'Ekonomik dalgalanmalar uluslararası ticaret modellerini etkiliyor.', englishText: 'Economic fluctuations affect international trade patterns.' },
        { targetText: 'İlaç şirketi yenilikçi tedaviler geliştirdi.', englishText: 'The pharmaceutical company developed innovative treatments.' },
        { targetText: 'Çevresel sürdürülebilirlik kapsamlı politika değişiklikleri gerektiriyor.', englishText: 'Environmental sustainability requires comprehensive policy changes.' },
        { targetText: 'Teknolojik ilerleme iletişim yöntemlerinde devrim yarattı.', englishText: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    norwegian: {
      beginner: [
        { targetText: 'Katten sitter på stolen.', englishText: 'The cat sits on the chair.' },
        { targetText: 'Jeg liker å spise epler.', englishText: 'I like to eat apples.' },
        { targetText: 'Boka ligger på bordet.', englishText: 'The book is on the table.' },
        { targetText: 'Hun drikker vann hver dag.', englishText: 'She drinks water every day.' },
        { targetText: 'Sola skinner i dag.', englishText: 'The sun is shining today.' }
      ],
      intermediate: [
        { targetText: 'Værmelding varsler regn i morgen.', englishText: 'The weather forecast predicts rain tomorrow.' },
        { targetText: 'Jeg må fullføre leksene mine før middag.', englishText: 'I need to finish my homework before dinner.' },
        { targetText: 'Konserten ble avlyst på grunn av dårlig vær.', englishText: 'The concert was cancelled due to bad weather.' },
        { targetText: 'Hun liker å lese kriminalromaner på fritiden.', englishText: 'She enjoys reading mystery novels in her free time.' },
        { targetText: 'Restauranten serverer deilig tradisjonell mat.', englishText: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { targetText: 'Den arkeologiske ekspedisjonen oppdaget gamle gjenstander.', englishText: 'The archaeological expedition uncovered ancient artifacts.' },
        { targetText: 'Økonomiske svingninger påvirker internasjonale handelsmønstre.', englishText: 'Economic fluctuations affect international trade patterns.' },
        { targetText: 'Farmasøytisk selskap utviklet innovative behandlinger.', englishText: 'The pharmaceutical company developed innovative treatments.' },
        { targetText: 'Miljømessig bærekraft krever omfattende politiske endringer.', englishText: 'Environmental sustainability requires comprehensive policy changes.' },
        { targetText: 'Teknologiske fremskritt revolusjonerte kommunikasjonsmetoder.', englishText: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    italian: {
      beginner: [
        { targetText: 'Il gatto si siede sulla sedia.', englishText: 'The cat sits on the chair.' },
        { targetText: 'Mi piace mangiare le mele.', englishText: 'I like to eat apples.' },
        { targetText: 'Il libro è sul tavolo.', englishText: 'The book is on the table.' },
        { targetText: 'Lei beve acqua ogni giorno.', englishText: 'She drinks water every day.' },
        { targetText: 'Il sole splende oggi.', englishText: 'The sun is shining today.' }
      ],
      intermediate: [
        { targetText: 'Le previsioni meteo predicono pioggia domani.', englishText: 'The weather forecast predicts rain tomorrow.' },
        { targetText: 'Devo finire i compiti prima di cena.', englishText: 'I need to finish my homework before dinner.' },
        { targetText: 'Il concerto è stato cancellato a causa del maltempo.', englishText: 'The concert was cancelled due to bad weather.' },
        { targetText: 'Le piace leggere romanzi gialli nel tempo libero.', englishText: 'She enjoys reading mystery novels in her free time.' },
        { targetText: 'Il ristorante serve deliziosa cucina tradizionale.', englishText: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { targetText: 'La spedizione archeologica ha scoperto antichi manufatti.', englishText: 'The archaeological expedition uncovered ancient artifacts.' },
        { targetText: 'Le fluttuazioni economiche influenzano i modelli commerciali internazionali.', englishText: 'Economic fluctuations affect international trade patterns.' },
        { targetText: 'L\'azienda farmaceutica ha sviluppato trattamenti innovativi.', englishText: 'The pharmaceutical company developed innovative treatments.' },
        { targetText: 'La sostenibilità ambientale richiede cambiamenti politici completi.', englishText: 'Environmental sustainability requires comprehensive policy changes.' },
        { targetText: 'L\'avanzamento tecnologico ha rivoluzionato i metodi di comunicazione.', englishText: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    portuguese: {
      beginner: [
        { targetText: 'O gato senta na cadeira.', englishText: 'The cat sits on the chair.' },
        { targetText: 'Eu gosto de comer maçãs.', englishText: 'I like to eat apples.' },
        { targetText: 'O livro está na mesa.', englishText: 'The book is on the table.' },
        { targetText: 'Ela bebe água todos os dias.', englishText: 'She drinks water every day.' },
        { targetText: 'O sol brilha hoje.', englishText: 'The sun is shining today.' }
      ],
      intermediate: [
        { targetText: 'A previsão do tempo prevê chuva amanhã.', englishText: 'The weather forecast predicts rain tomorrow.' },
        { targetText: 'Preciso terminar minha lição de casa antes do jantar.', englishText: 'I need to finish my homework before dinner.' },
        { targetText: 'O concerto foi cancelado devido ao mau tempo.', englishText: 'The concert was cancelled due to bad weather.' },
        { targetText: 'Ela gosta de ler romances policiais no tempo livre.', englishText: 'She enjoys reading mystery novels in her free time.' },
        { targetText: 'O restaurante serve deliciosa culinária tradicional.', englishText: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { targetText: 'A expedição arqueológica descobriu artefatos antigos.', englishText: 'The archaeological expedition uncovered ancient artifacts.' },
        { targetText: 'Flutuações econômicas afetam padrões de comércio internacional.', englishText: 'Economic fluctuations affect international trade patterns.' },
        { targetText: 'A empresa farmacêutica desenvolveu tratamentos inovadores.', englishText: 'The pharmaceutical company developed innovative treatments.' },
        { targetText: 'A sustentabilidade ambiental requer mudanças políticas abrangentes.', englishText: 'Environmental sustainability requires comprehensive policy changes.' },
        { targetText: 'O avanço tecnológico revolucionou os métodos de comunicação.', englishText: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    swedish: {
      beginner: [
        { targetText: 'Katten sitter på stolen.', englishText: 'The cat sits on the chair.' },
        { targetText: 'Jag tycker om att äta äpplen.', englishText: 'I like to eat apples.' },
        { targetText: 'Boken ligger på bordet.', englishText: 'The book is on the table.' },
        { targetText: 'Hon dricker vatten varje dag.', englishText: 'She drinks water every day.' },
        { targetText: 'Solen skiner idag.', englishText: 'The sun is shining today.' }
      ],
      intermediate: [
        { targetText: 'Väderleken förutspår regn imorgon.', englishText: 'The weather forecast predicts rain tomorrow.' },
        { targetText: 'Jag måste avsluta mina läxor före middagen.', englishText: 'I need to finish my homework before dinner.' },
        { targetText: 'Konserten ställdes in på grund av dåligt väder.', englishText: 'The concert was cancelled due to bad weather.' },
        { targetText: 'Hon tycker om att läsa deckare på fritiden.', englishText: 'She enjoys reading mystery novels in her free time.' },
        { targetText: 'Restaurangen serverar läcker traditionell mat.', englishText: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { targetText: 'Den arkeologiska expeditionen upptäckte gamla föremål.', englishText: 'The archaeological expedition uncovered ancient artifacts.' },
        { targetText: 'Ekonomiska fluktuationer påverkar internationella handelsmönster.', englishText: 'Economic fluctuations affect international trade patterns.' },
        { targetText: 'Läkemedelsföretaget utvecklade innovativa behandlingar.', englishText: 'The pharmaceutical company developed innovative treatments.' },
        { targetText: 'Miljömässig hållbarhet kräver omfattande politiska förändringar.', englishText: 'Environmental sustainability requires comprehensive policy changes.' },
        { targetText: 'Teknologiska framsteg revolutionerade kommunikationsmetoder.', englishText: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    dutch: {
      beginner: [
        { targetText: 'De kat zit op de stoel.', englishText: 'The cat sits on the chair.' },
        { targetText: 'Ik eet graag appels.', englishText: 'I like to eat apples.' },
        { targetText: 'Het boek ligt op de tafel.', englishText: 'The book is on the table.' },
        { targetText: 'Zij drinkt elke dag water.', englishText: 'She drinks water every day.' },
        { targetText: 'De zon schijnt vandaag.', englishText: 'The sun is shining today.' }
      ],
      intermediate: [
        { targetText: 'De weersvoorspelling voorspelt morgen regen.', englishText: 'The weather forecast predicts rain tomorrow.' },
        { targetText: 'Ik moet mijn huiswerk afmaken voor het avondeten.', englishText: 'I need to finish my homework before dinner.' },
        { targetText: 'Het concert werd afgelast vanwege slecht weer.', englishText: 'The concert was cancelled due to bad weather.' },
        { targetText: 'Zij leest graag detectiveromans in haar vrije tijd.', englishText: 'She enjoys reading mystery novels in her free time.' },
        { targetText: 'Het restaurant serveert heerlijke traditionele keuken.', englishText: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { targetText: 'De archeologische expeditie ontdekte oude artefacten.', englishText: 'The archaeological expedition uncovered ancient artifacts.' },
        { targetText: 'Economische fluctuaties beïnvloeden internationale handelspatronen.', englishText: 'Economic fluctuations affect international trade patterns.' },
        { targetText: 'Het farmaceutische bedrijf ontwikkelde innovatieve behandelingen.', englishText: 'The pharmaceutical company developed innovative treatments.' },
        { targetText: 'Duurzaamheid vereist uitgebreide beleidsveranderingen.', englishText: 'Environmental sustainability requires comprehensive policy changes.' },
        { targetText: 'Technologische vooruitgang revolutioneerde communicatiemethoden.', englishText: 'The technological advancement revolutionized communication methods.' }
      ]
    }
  }
  
  // Default to English sentences if language not found
  const defaultSentences = {
    beginner: [
      { targetText: 'The cat sits on the mat.', englishText: 'The cat sits on the mat.' },
      { targetText: 'I like to eat apples.', englishText: 'I like to eat apples.' },
      { targetText: 'The book is on the table.', englishText: 'The book is on the table.' },
      { targetText: 'She drinks water every day.', englishText: 'She drinks water every day.' },
      { targetText: 'The sun is bright today.', englishText: 'The sun is bright today.' }
    ],
    intermediate: [
      { targetText: 'The weather forecast predicts rain tomorrow.', englishText: 'The weather forecast predicts rain tomorrow.' },
      { targetText: 'I need to finish my homework before dinner.', englishText: 'I need to finish my homework before dinner.' },
      { targetText: 'The concert was cancelled due to bad weather.', englishText: 'The concert was cancelled due to bad weather.' },
      { targetText: 'She enjoys reading mystery novels in her free time.', englishText: 'She enjoys reading mystery novels in her free time.' },
      { targetText: 'The restaurant serves delicious traditional cuisine.', englishText: 'The restaurant serves delicious traditional cuisine.' }
    ],
    advanced: [
      { targetText: 'The archaeological expedition uncovered ancient artifacts.', englishText: 'The archaeological expedition uncovered ancient artifacts.' },
      { targetText: 'Economic fluctuations affect international trade patterns.', englishText: 'Economic fluctuations affect international trade patterns.' },
      { targetText: 'The pharmaceutical company developed innovative treatments.', englishText: 'The pharmaceutical company developed innovative treatments.' },
      { targetText: 'Environmental sustainability requires comprehensive policy changes.', englishText: 'Environmental sustainability requires comprehensive policy changes.' },
      { targetText: 'The technological advancement revolutionized communication methods.', englishText: 'The technological advancement revolutionized communication methods.' }
    ]
  }
  
  const languageData = sentencesData[language as keyof typeof sentencesData] || defaultSentences
  return languageData[difficulty as keyof typeof languageData] || languageData.beginner
}
