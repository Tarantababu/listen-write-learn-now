import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DIFFICULTY_PROMPTS = {
  simple: {
    nouns: "Generate common, everyday German nouns that beginners should know (household items, basic animals, food). Focus on the most frequently used words.",
    patterns: "Create simple sentence patterns using 'Das ist ein/eine' structure. Keep vocabulary basic and sentences short."
  },
  normal: {
    nouns: "Generate intermediate German nouns including abstract concepts, workplace items, and more specific categories. Mix common and moderately challenging words.",
    patterns: "Create sentence patterns with possessive articles (mein/meine) and basic verbs. Include some compound sentences."
  },
  complex: {
    nouns: "Generate advanced German nouns including technical terms, literary vocabulary, and complex abstract concepts. Challenge the learner.",
    patterns: "Create complex sentence patterns with multiple cases, adjective declensions, and subordinate clauses."
  }
};

// Helper function to clean JSON response from markdown
function cleanJsonResponse(content: string): string {
  // Remove markdown code blocks if present
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, difficulty, nouns, count, noun, expectedAnswer, userSpeech, pattern, previousPatterns } = await req.json();

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt = '';
    let responseFormat = '';

    switch (type) {
      case 'nouns':
        prompt = `${DIFFICULTY_PROMPTS[difficulty].nouns}

Generate exactly ${count} German nouns with their articles and English meanings.

Return a JSON array with this exact format:
[
  {
    "id": "noun_1",
    "word": "Lampe",
    "article": "die",
    "meaning": "lamp",
    "difficulty": "${difficulty}"
  }
]

Ensure variety in articles (der, die, das) and make sure all words are appropriate for ${difficulty} level learners.`;
        responseFormat = 'Return only valid JSON without markdown formatting or code blocks. No additional text or explanations.';
        break;

      case 'pattern':
        const nounList = nouns.map((n: any) => `${n.article} ${n.word} (${n.meaning})`).join(', ');
        const usedPatterns = previousPatterns.length > 0 ? `\nAvoid these previously used patterns: ${previousPatterns.join(', ')}` : '';
        
        prompt = `${DIFFICULTY_PROMPTS[difficulty].patterns}

Available nouns: ${nounList}${usedPatterns}

Create a sentence pattern drill where the user fills in blanks with the appropriate article and noun.

Return JSON in this exact format:
{
  "id": "drill_1",
  "pattern": "Das ist ___ ___.",
  "blanks": ["article", "noun"],
  "difficulty": "${difficulty}",
  "expectedAnswers": ["Das ist eine Lampe.", "Das ist ein Buch."]
}

Generate 3-5 expected answers using different nouns from the list.`;
        responseFormat = 'Return only valid JSON without markdown formatting or code blocks. No additional text or explanations.';
        break;

      case 'explanation':
        prompt = `Explain why the German noun "${noun.word}" has the article "${noun.article}" in simple, clear terms. 

Keep the explanation under 50 words and focus on practical rules or patterns that help remember the gender.

Example format: "Most nouns ending in -e are feminine (die), so 'Lampe' takes 'die'."`;
        responseFormat = 'Return only the explanation text, no JSON, no markdown formatting.';
        break;

      case 'evaluation':
        prompt = `Evaluate this German speech attempt:

Pattern: "${pattern}"
Expected: "${expectedAnswer}"
User said: "${userSpeech}"

Analyze:
1. Grammar correctness
2. Article usage
3. Word order
4. Missing or incorrect words

Return JSON in this exact format:
{
  "isCorrect": false,
  "feedback": "Good attempt! You used the correct article 'die' but missed the word order.",
  "corrections": ["Check word order", "Use 'eine' instead of 'ein'"]
}

Be encouraging but precise about errors.`;
        responseFormat = 'Return only valid JSON without markdown formatting or code blocks. No additional text or explanations.';
        break;

      default:
        throw new Error('Invalid request type');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a German language learning assistant. ${responseFormat}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let result;
    if (type === 'explanation') {
      result = { explanation: content };
    } else if (type === 'nouns') {
      // Clean and parse JSON response
      const cleanedContent = cleanJsonResponse(content);
      result = { nouns: JSON.parse(cleanedContent) };
    } else if (type === 'pattern') {
      // Clean and parse JSON response
      const cleanedContent = cleanJsonResponse(content);
      result = { drill: JSON.parse(cleanedContent) };
    } else if (type === 'evaluation') {
      // Clean and parse JSON response
      const cleanedContent = cleanJsonResponse(content);
      result = { evaluation: JSON.parse(cleanedContent) };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-preaching-content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});