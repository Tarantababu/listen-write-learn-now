
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
  // Sample sentences based on difficulty level
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
        translation: sentence.translation,
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
    translation: fallbackSentence.translation,
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
  // This would ideally come from a more comprehensive database
  const sentences = {
    beginner: [
      { text: 'The cat sits on the mat.', translation: 'Le chat s\'assoit sur le tapis.' },
      { text: 'I like to eat apples.', translation: 'J\'aime manger des pommes.' },
      { text: 'The book is on the table.', translation: 'Le livre est sur la table.' },
      { text: 'She drinks water every day.', translation: 'Elle boit de l\'eau tous les jours.' },
      { text: 'The sun is bright today.', translation: 'Le soleil est brillant aujourd\'hui.' }
    ],
    intermediate: [
      { text: 'The weather forecast predicts rain tomorrow.', translation: 'Les prévisions météorologiques prévoient de la pluie demain.' },
      { text: 'I need to finish my homework before dinner.', translation: 'Je dois finir mes devoirs avant le dîner.' },
      { text: 'The concert was cancelled due to bad weather.', translation: 'Le concert a été annulé à cause du mauvais temps.' },
      { text: 'She enjoys reading mystery novels in her free time.', translation: 'Elle aime lire des romans policiers pendant son temps libre.' },
      { text: 'The restaurant serves delicious traditional cuisine.', translation: 'Le restaurant sert une délicieuse cuisine traditionnelle.' }
    ],
    advanced: [
      { text: 'The archaeological expedition uncovered ancient artifacts.', translation: 'L\'expédition archéologique a découvert des artefacts anciens.' },
      { text: 'Economic fluctuations affect international trade patterns.', translation: 'Les fluctuations économiques affectent les modèles de commerce international.' },
      { text: 'The pharmaceutical company developed innovative treatments.', translation: 'L\'entreprise pharmaceutique a développé des traitements innovants.' },
      { text: 'Environmental sustainability requires comprehensive policy changes.', translation: 'La durabilité environnementale nécessite des changements politiques complets.' },
      { text: 'The technological advancement revolutionized communication methods.', translation: 'L\'avancement technologique a révolutionné les méthodes de communication.' }
    ]
  }
  
  return sentences[difficulty as keyof typeof sentences] || sentences.beginner
}
