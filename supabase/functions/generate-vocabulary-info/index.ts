
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

    // Split the text into sentences (simple split by periods for demo)
    const rawSentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    // Create a meaningful analysis
    const analysis: AnalysisContent = {
      sentences: rawSentences.map((sentenceText) => ({
        text: sentenceText.trim(),
        analysis: {
          words: generateWords(sentenceText, language),
          grammarInsights: generateGrammarInsights(sentenceText, language),
          structure: generateStructureAnalysis(sentenceText, language)
        }
      })),
      commonPatterns: generateCommonPatterns(language),
      summary: generateSummary(text, language)
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

// Helper functions to generate mock analysis
function generateWords(sentence: string, language: string): Word[] {
  const words = sentence
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)
  
  return words.map((word) => {
    const cleanWord = word.replace(/[,.;:!?()\[\]{}""]/g, '').toLowerCase()
    return {
      word: cleanWord,
      definition: `Definition of "${cleanWord}" in ${language}`,
      etymologyInsight: `Etymology insights for "${cleanWord}"`,
      englishCousin: `Similar English word for "${cleanWord}"`
    }
  })
}

function generateGrammarInsights(sentence: string, language: string): string[] {
  return [
    `This sentence uses a common ${language} structure.`,
    `Note the use of verb tenses in this sentence.`,
    `The word order follows standard ${language} conventions.`
  ]
}

function generateStructureAnalysis(sentence: string, language: string): string {
  return `This is a ${sentence.length > 50 ? 'complex' : 'simple'} sentence structure common in ${language}.`
}

function generateCommonPatterns(language: string): string[] {
  return [
    `Pattern 1: Common verb conjugation pattern in ${language}`,
    `Pattern 2: Typical noun-adjective agreement in ${language}`,
    `Pattern 3: Question formation in ${language}`,
    `Pattern 4: Common idiomatic expressions in ${language}`
  ]
}

function generateSummary(text: string, language: string): string {
  return `This is a ${text.length > 200 ? 'longer' : 'shorter'} ${language} text that demonstrates several key grammar and vocabulary concepts. It would be beneficial to study the highlighted patterns and practice the sentence structures.`
}
