
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
    const words = extractWords(sentence.text)
    const unknownWords = words.filter(word => !knownWords.has(word.toLowerCase()))
    
    if (unknownWords.length >= targetUnknownWords && unknownWords.length <= targetUnknownWords + 2) {
      return {
        id: crypto.randomUUID(),
        sessionId,
        exerciseType,
        sentence: sentence.text,
        translation: sentence.translation, // This is always English
        targetWords: unknownWords.slice(0, targetUnknownWords),
        unknownWords: unknownWords,
        difficultyScore: calculateDifficultyScore(unknownWords.length, words.length),
        explanation: `Focus on learning: ${unknownWords.slice(0, targetUnknownWords).join(', ')}`,
        hints: generateHints(unknownWords.slice(0, targetUnknownWords), sentence.translation)
      }
    }
  }
  
  // Fallback to first available sentence if no perfect match
  const fallbackSentence = sentences[0]
  const words = extractWords(fallbackSentence.text)
  const unknownWords = words.filter(word => !knownWords.has(word.toLowerCase()))
  
  return {
    id: crypto.randomUUID(),
    sessionId,
    exerciseType,
    sentence: fallbackSentence.text,
    translation: fallbackSentence.translation, // This is always English
    targetWords: unknownWords.slice(0, Math.min(targetUnknownWords, unknownWords.length)),
    unknownWords: unknownWords,
    difficultyScore: calculateDifficultyScore(unknownWords.length, words.length),
    explanation: `Focus on learning: ${unknownWords.slice(0, Math.min(targetUnknownWords, unknownWords.length)).join(', ')}`,
    hints: generateHints(unknownWords.slice(0, Math.min(targetUnknownWords, unknownWords.length)), fallbackSentence.translation)
  }
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
  // Sample sentences in different languages with English translations
  const sentencesData = {
    german: {
      beginner: [
        { text: 'Die Katze sitzt auf dem Stuhl.', translation: 'The cat sits on the chair.' },
        { text: 'Ich esse gerne Äpfel.', translation: 'I like to eat apples.' },
        { text: 'Das Buch liegt auf dem Tisch.', translation: 'The book is on the table.' },
        { text: 'Sie trinkt jeden Tag Wasser.', translation: 'She drinks water every day.' },
        { text: 'Die Sonne scheint heute hell.', translation: 'The sun is shining bright today.' }
      ],
      intermediate: [
        { text: 'Die Wettervorhersage sagt morgen Regen voraus.', translation: 'The weather forecast predicts rain tomorrow.' },
        { text: 'Ich muss meine Hausaufgaben vor dem Abendessen beenden.', translation: 'I need to finish my homework before dinner.' },
        { text: 'Das Konzert wurde wegen schlechten Wetters abgesagt.', translation: 'The concert was cancelled due to bad weather.' },
        { text: 'Sie liest gerne Kriminalromane in ihrer Freizeit.', translation: 'She enjoys reading mystery novels in her free time.' },
        { text: 'Das Restaurant serviert köstliche traditionelle Küche.', translation: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { text: 'Die archäologische Expedition entdeckte antike Artefakte.', translation: 'The archaeological expedition uncovered ancient artifacts.' },
        { text: 'Wirtschaftliche Schwankungen beeinflussen internationale Handelsmuster.', translation: 'Economic fluctuations affect international trade patterns.' },
        { text: 'Das Pharmaunternehmen entwickelte innovative Behandlungen.', translation: 'The pharmaceutical company developed innovative treatments.' },
        { text: 'Umweltschutz erfordert umfassende politische Veränderungen.', translation: 'Environmental sustainability requires comprehensive policy changes.' },
        { text: 'Der technologische Fortschritt revolutionierte die Kommunikationsmethoden.', translation: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    spanish: {
      beginner: [
        { text: 'El gato se sienta en la silla.', translation: 'The cat sits on the chair.' },
        { text: 'Me gusta comer manzanas.', translation: 'I like to eat apples.' },
        { text: 'El libro está en la mesa.', translation: 'The book is on the table.' },
        { text: 'Ella bebe agua todos los días.', translation: 'She drinks water every day.' },
        { text: 'El sol brilla hoy.', translation: 'The sun is shining today.' }
      ],
      intermediate: [
        { text: 'El pronóstico del tiempo predice lluvia mañana.', translation: 'The weather forecast predicts rain tomorrow.' },
        { text: 'Necesito terminar mi tarea antes de la cena.', translation: 'I need to finish my homework before dinner.' },
        { text: 'El concierto fue cancelado debido al mal tiempo.', translation: 'The concert was cancelled due to bad weather.' },
        { text: 'A ella le gusta leer novelas de misterio en su tiempo libre.', translation: 'She enjoys reading mystery novels in her free time.' },
        { text: 'El restaurante sirve deliciosa cocina tradicional.', translation: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { text: 'La expedición arqueológica descubrió artefactos antiguos.', translation: 'The archaeological expedition uncovered ancient artifacts.' },
        { text: 'Las fluctuaciones económicas afectan los patrones de comercio internacional.', translation: 'Economic fluctuations affect international trade patterns.' },
        { text: 'La empresa farmacéutica desarrolló tratamientos innovadores.', translation: 'The pharmaceutical company developed innovative treatments.' },
        { text: 'La sostenibilidad ambiental requiere cambios políticos integrales.', translation: 'Environmental sustainability requires comprehensive policy changes.' },
        { text: 'El avance tecnológico revolucionó los métodos de comunicación.', translation: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    french: {
      beginner: [
        { text: 'Le chat s\'assoit sur la chaise.', translation: 'The cat sits on the chair.' },
        { text: 'J\'aime manger des pommes.', translation: 'I like to eat apples.' },
        { text: 'Le livre est sur la table.', translation: 'The book is on the table.' },
        { text: 'Elle boit de l\'eau tous les jours.', translation: 'She drinks water every day.' },
        { text: 'Le soleil brille aujourd\'hui.', translation: 'The sun is shining today.' }
      ],
      intermediate: [
        { text: 'Les prévisions météorologiques prévoient de la pluie demain.', translation: 'The weather forecast predicts rain tomorrow.' },
        { text: 'Je dois finir mes devoirs avant le dîner.', translation: 'I need to finish my homework before dinner.' },
        { text: 'Le concert a été annulé à cause du mauvais temps.', translation: 'The concert was cancelled due to bad weather.' },
        { text: 'Elle aime lire des romans policiers pendant son temps libre.', translation: 'She enjoys reading mystery novels in her free time.' },
        { text: 'Le restaurant sert une délicieuse cuisine traditionnelle.', translation: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { text: 'L\'expédition archéologique a découvert des artefacts anciens.', translation: 'The archaeological expedition uncovered ancient artifacts.' },
        { text: 'Les fluctuations économiques affectent les modèles de commerce international.', translation: 'Economic fluctuations affect international trade patterns.' },
        { text: 'L\'entreprise pharmaceutique a développé des traitements innovants.', translation: 'The pharmaceutical company developed innovative treatments.' },
        { text: 'La durabilité environnementale nécessite des changements politiques complets.', translation: 'Environmental sustainability requires comprehensive policy changes.' },
        { text: 'L\'avancement technologique a révolutionné les méthodes de communication.', translation: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    turkish: {
      beginner: [
        { text: 'Kedi sandalyede oturuyor.', translation: 'The cat sits on the chair.' },
        { text: 'Elma yemeyi seviyorum.', translation: 'I like to eat apples.' },
        { text: 'Kitap masanın üzerinde.', translation: 'The book is on the table.' },
        { text: 'O her gün su içer.', translation: 'She drinks water every day.' },
        { text: 'Güneş bugün parlıyor.', translation: 'The sun is shining today.' }
      ],
      intermediate: [
        { text: 'Hava durumu yarın yağmur öngörüyor.', translation: 'The weather forecast predicts rain tomorrow.' },
        { text: 'Akşam yemeğinden önce ödevimi bitirmem gerekiyor.', translation: 'I need to finish my homework before dinner.' },
        { text: 'Konser kötü hava nedeniyle iptal edildi.', translation: 'The concert was cancelled due to bad weather.' },
        { text: 'Boş zamanlarında polisiye roman okumayı seviyor.', translation: 'She enjoys reading mystery novels in her free time.' },
        { text: 'Restoran lezzetli geleneksel yemekler sunuyor.', translation: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { text: 'Arkeolojik keşif ekibi antik eserler buldu.', translation: 'The archaeological expedition uncovered ancient artifacts.' },
        { text: 'Ekonomik dalgalanmalar uluslararası ticaret modellerini etkiliyor.', translation: 'Economic fluctuations affect international trade patterns.' },
        { text: 'İlaç şirketi yenilikçi tedaviler geliştirdi.', translation: 'The pharmaceutical company developed innovative treatments.' },
        { text: 'Çevresel sürdürülebilirlik kapsamlı politika değişiklikleri gerektiriyor.', translation: 'Environmental sustainability requires comprehensive policy changes.' },
        { text: 'Teknolojik ilerleme iletişim yöntemlerinde devrim yarattı.', translation: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    norwegian: {
      beginner: [
        { text: 'Katten sitter på stolen.', translation: 'The cat sits on the chair.' },
        { text: 'Jeg liker å spise epler.', translation: 'I like to eat apples.' },
        { text: 'Boka ligger på bordet.', translation: 'The book is on the table.' },
        { text: 'Hun drikker vann hver dag.', translation: 'She drinks water every day.' },
        { text: 'Sola skinner i dag.', translation: 'The sun is shining today.' }
      ],
      intermediate: [
        { text: 'Værmelding varsler regn i morgen.', translation: 'The weather forecast predicts rain tomorrow.' },
        { text: 'Jeg må fullføre leksene mine før middag.', translation: 'I need to finish my homework before dinner.' },
        { text: 'Konserten ble avlyst på grunn av dårlig vær.', translation: 'The concert was cancelled due to bad weather.' },
        { text: 'Hun liker å lese kriminalromaner på fritiden.', translation: 'She enjoys reading mystery novels in her free time.' },
        { text: 'Restauranten serverer deilig tradisjonell mat.', translation: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { text: 'Den arkeologiske ekspedisjonen oppdaget gamle gjenstander.', translation: 'The archaeological expedition uncovered ancient artifacts.' },
        { text: 'Økonomiske svingninger påvirker internasjonale handelsmønstre.', translation: 'Economic fluctuations affect international trade patterns.' },
        { text: 'Farmasøytisk selskap utviklet innovative behandlinger.', translation: 'The pharmaceutical company developed innovative treatments.' },
        { text: 'Miljømessig bærekraft krever omfattende politiske endringer.', translation: 'Environmental sustainability requires comprehensive policy changes.' },
        { text: 'Teknologiske fremskritt revolusjonerte kommunikasjonsmetoder.', translation: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    italian: {
      beginner: [
        { text: 'Il gatto si siede sulla sedia.', translation: 'The cat sits on the chair.' },
        { text: 'Mi piace mangiare le mele.', translation: 'I like to eat apples.' },
        { text: 'Il libro è sul tavolo.', translation: 'The book is on the table.' },
        { text: 'Lei beve acqua ogni giorno.', translation: 'She drinks water every day.' },
        { text: 'Il sole splende oggi.', translation: 'The sun is shining today.' }
      ],
      intermediate: [
        { text: 'Le previsioni meteo predicono pioggia domani.', translation: 'The weather forecast predicts rain tomorrow.' },
        { text: 'Devo finire i compiti prima di cena.', translation: 'I need to finish my homework before dinner.' },
        { text: 'Il concerto è stato cancellato a causa del maltempo.', translation: 'The concert was cancelled due to bad weather.' },
        { text: 'Le piace leggere romanzi gialli nel tempo libero.', translation: 'She enjoys reading mystery novels in her free time.' },
        { text: 'Il ristorante serve deliziosa cucina tradizionale.', translation: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { text: 'La spedizione archeologica ha scoperto antichi manufatti.', translation: 'The archaeological expedition uncovered ancient artifacts.' },
        { text: 'Le fluttuazioni economiche influenzano i modelli commerciali internazionali.', translation: 'Economic fluctuations affect international trade patterns.' },
        { text: 'L\'azienda farmaceutica ha sviluppato trattamenti innovativi.', translation: 'The pharmaceutical company developed innovative treatments.' },
        { text: 'La sostenibilità ambientale richiede cambiamenti politici completi.', translation: 'Environmental sustainability requires comprehensive policy changes.' },
        { text: 'L\'avanzamento tecnologico ha rivoluzionato i metodi di comunicazione.', translation: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    portuguese: {
      beginner: [
        { text: 'O gato senta na cadeira.', translation: 'The cat sits on the chair.' },
        { text: 'Eu gosto de comer maçãs.', translation: 'I like to eat apples.' },
        { text: 'O livro está na mesa.', translation: 'The book is on the table.' },
        { text: 'Ela bebe água todos os dias.', translation: 'She drinks water every day.' },
        { text: 'O sol brilha hoje.', translation: 'The sun is shining today.' }
      ],
      intermediate: [
        { text: 'A previsão do tempo prevê chuva amanhã.', translation: 'The weather forecast predicts rain tomorrow.' },
        { text: 'Preciso terminar minha lição de casa antes do jantar.', translation: 'I need to finish my homework before dinner.' },
        { text: 'O concerto foi cancelado devido ao mau tempo.', translation: 'The concert was cancelled due to bad weather.' },
        { text: 'Ela gosta de ler romances policiais no tempo livre.', translation: 'She enjoys reading mystery novels in her free time.' },
        { text: 'O restaurante serve deliciosa culinária tradicional.', translation: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { text: 'A expedição arqueológica descobriu artefatos antigos.', translation: 'The archaeological expedition uncovered ancient artifacts.' },
        { text: 'Flutuações econômicas afetam padrões de comércio internacional.', translation: 'Economic fluctuations affect international trade patterns.' },
        { text: 'A empresa farmacêutica desenvolveu tratamentos inovadores.', translation: 'The pharmaceutical company developed innovative treatments.' },
        { text: 'A sustentabilidade ambiental requer mudanças políticas abrangentes.', translation: 'Environmental sustainability requires comprehensive policy changes.' },
        { text: 'O avanço tecnológico revolucionou os métodos de comunicação.', translation: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    swedish: {
      beginner: [
        { text: 'Katten sitter på stolen.', translation: 'The cat sits on the chair.' },
        { text: 'Jag tycker om att äta äpplen.', translation: 'I like to eat apples.' },
        { text: 'Boken ligger på bordet.', translation: 'The book is on the table.' },
        { text: 'Hon dricker vatten varje dag.', translation: 'She drinks water every day.' },
        { text: 'Solen skiner idag.', translation: 'The sun is shining today.' }
      ],
      intermediate: [
        { text: 'Väderleken förutspår regn imorgon.', translation: 'The weather forecast predicts rain tomorrow.' },
        { text: 'Jag måste avsluta mina läxor före middagen.', translation: 'I need to finish my homework before dinner.' },
        { text: 'Konserten ställdes in på grund av dåligt väder.', translation: 'The concert was cancelled due to bad weather.' },
        { text: 'Hon tycker om att läsa deckare på fritiden.', translation: 'She enjoys reading mystery novels in her free time.' },
        { text: 'Restaurangen serverar läcker traditionell mat.', translation: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { text: 'Den arkeologiska expeditionen upptäckte gamla föremål.', translation: 'The archaeological expedition uncovered ancient artifacts.' },
        { text: 'Ekonomiska fluktuationer påverkar internationella handelsmönster.', translation: 'Economic fluctuations affect international trade patterns.' },
        { text: 'Läkemedelsföretaget utvecklade innovativa behandlingar.', translation: 'The pharmaceutical company developed innovative treatments.' },
        { text: 'Miljömässig hållbarhet kräver omfattande politiska förändringar.', translation: 'Environmental sustainability requires comprehensive policy changes.' },
        { text: 'Teknologiska framsteg revolutionerade kommunikationsmetoder.', translation: 'The technological advancement revolutionized communication methods.' }
      ]
    },
    dutch: {
      beginner: [
        { text: 'De kat zit op de stoel.', translation: 'The cat sits on the chair.' },
        { text: 'Ik eet graag appels.', translation: 'I like to eat apples.' },
        { text: 'Het boek ligt op de tafel.', translation: 'The book is on the table.' },
        { text: 'Zij drinkt elke dag water.', translation: 'She drinks water every day.' },
        { text: 'De zon schijnt vandaag.', translation: 'The sun is shining today.' }
      ],
      intermediate: [
        { text: 'De weersvoorspelling voorspelt morgen regen.', translation: 'The weather forecast predicts rain tomorrow.' },
        { text: 'Ik moet mijn huiswerk afmaken voor het avondeten.', translation: 'I need to finish my homework before dinner.' },
        { text: 'Het concert werd afgelast vanwege slecht weer.', translation: 'The concert was cancelled due to bad weather.' },
        { text: 'Zij leest graag detectiveromans in haar vrije tijd.', translation: 'She enjoys reading mystery novels in her free time.' },
        { text: 'Het restaurant serveert heerlijke traditionele keuken.', translation: 'The restaurant serves delicious traditional cuisine.' }
      ],
      advanced: [
        { text: 'De archeologische expeditie ontdekte oude artefacten.', translation: 'The archaeological expedition uncovered ancient artifacts.' },
        { text: 'Economische fluctuaties beïnvloeden internationale handelspatronen.', translation: 'Economic fluctuations affect international trade patterns.' },
        { text: 'Het farmaceutische bedrijf ontwikkelde innovatieve behandelingen.', translation: 'The pharmaceutical company developed innovative treatments.' },
        { text: 'Duurzaamheid vereist uitgebreide beleidsveranderingen.', translation: 'Environmental sustainability requires comprehensive policy changes.' },
        { text: 'Technologische vooruitgang revolutioneerde communicatiemethoden.', translation: 'The technological advancement revolutionized communication methods.' }
      ]
    }
  }
  
  // Default to English if language not found
  const defaultSentences = {
    beginner: [
      { text: 'The cat sits on the mat.', translation: 'The cat sits on the mat.' },
      { text: 'I like to eat apples.', translation: 'I like to eat apples.' },
      { text: 'The book is on the table.', translation: 'The book is on the table.' },
      { text: 'She drinks water every day.', translation: 'She drinks water every day.' },
      { text: 'The sun is bright today.', translation: 'The sun is bright today.' }
    ],
    intermediate: [
      { text: 'The weather forecast predicts rain tomorrow.', translation: 'The weather forecast predicts rain tomorrow.' },
      { text: 'I need to finish my homework before dinner.', translation: 'I need to finish my homework before dinner.' },
      { text: 'The concert was cancelled due to bad weather.', translation: 'The concert was cancelled due to bad weather.' },
      { text: 'She enjoys reading mystery novels in her free time.', translation: 'She enjoys reading mystery novels in her free time.' },
      { text: 'The restaurant serves delicious traditional cuisine.', translation: 'The restaurant serves delicious traditional cuisine.' }
    ],
    advanced: [
      { text: 'The archaeological expedition uncovered ancient artifacts.', translation: 'The archaeological expedition uncovered ancient artifacts.' },
      { text: 'Economic fluctuations affect international trade patterns.', translation: 'Economic fluctuations affect international trade patterns.' },
      { text: 'The pharmaceutical company developed innovative treatments.', translation: 'The pharmaceutical company developed innovative treatments.' },
      { text: 'Environmental sustainability requires comprehensive policy changes.', translation: 'Environmental sustainability requires comprehensive policy changes.' },
      { text: 'The technological advancement revolutionized communication methods.', translation: 'The technological advancement revolutionized communication methods.' }
    ]
  }
  
  const languageData = sentencesData[language as keyof typeof sentencesData] || defaultSentences
  return languageData[difficulty as keyof typeof languageData] || languageData.beginner
}
