import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DIFFICULTY_PROMPTS = {
  simple: {
    nouns: "Generate common, everyday German nouns that beginners should know (household items, basic animals, food, family members, body parts, clothing, colors as nouns, basic nature words). Focus on the most frequently used words that beginners encounter first. Vary your selection to include different categories. NEVER use the same words twice - always provide fresh, different vocabulary.",
    patterns: "Create simple sentence patterns using 'Das ist ein/eine' structure. Keep vocabulary basic and sentences short."
  },
  normal: {
    nouns: "Generate intermediate German nouns including abstract concepts, workplace items, more specific categories (technology terms, hobby-related words, travel vocabulary, emotions as nouns, academic subjects, city/countryside terms). Mix common and moderately challenging words from various domains. ALWAYS provide unique, varied vocabulary - never repeat the same examples.",
    patterns: "Create sentence patterns with possessive articles (mein/meine) and basic verbs. Include some compound sentences."
  },
  complex: {
    nouns: "Generate advanced German nouns including technical terms, literary vocabulary, complex abstract concepts (philosophical terms, scientific vocabulary, business/economics terms, cultural concepts, specialized professions, compound words with multiple parts). Challenge the learner with sophisticated vocabulary. Ensure maximum variety in word selection.",
    patterns: "Create complex sentence patterns with multiple cases, adjective declensions, and subordinate clauses."
  }
};

// Helper function to clean JSON response from markdown
function cleanJsonResponse(content: string): string {
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return cleaned;
}

// Helper function to generate unique timestamp-based seed for variety
function generateSeed(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, difficulty, nouns, count, noun, expectedAnswer, userSpeech, pattern, previousPatterns, sessionId } = await req.json();

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt = '';
    let responseFormat = '';
    const seed = generateSeed();

    switch (type) {
      case 'nouns':
        prompt = `${DIFFICULTY_PROMPTS[difficulty].nouns}

Session ID: ${sessionId || 'default'} - Seed: ${seed}

Generate exactly ${count} different German nouns with their articles and English meanings. 

CRITICAL REQUIREMENTS:
- Use this seed (${seed}) to ensure randomness and avoid repetition
- NEVER use common examples like: der Tisch, die Lampe, das Buch, der Stuhl, die Katze, das Haus
- Each request must return completely different words
- Ensure authentic variety across all three genders (der, die, das)
- Focus on practical, real-world vocabulary appropriate for ${difficulty} level
- Mix different semantic categories (objects, concepts, living things, abstract terms)

Return a JSON array with this exact format:
[
  {
    "id": "noun_1", 
    "word": "[German word]",
    "article": "[der/die/das]",
    "meaning": "[English translation]",
    "difficulty": "${difficulty}"
  }
]

Generate ${count} completely unique German nouns that are different from typical textbook examples.`;
        responseFormat = 'Return only valid JSON without markdown formatting or code blocks. No additional text or explanations.';
        break;

      case 'pattern':
        if (!nouns || nouns.length === 0) {
          throw new Error('No nouns provided for pattern generation');
        }
        
        const nounList = nouns.map((n: any) => `${n.article} ${n.word} (${n.meaning})`).join(', ');
        const usedPatterns = previousPatterns && previousPatterns.length > 0 ? 
          `\nAvoid these previously used patterns: ${previousPatterns.join(', ')}` : '';
        
        prompt = `${DIFFICULTY_PROMPTS[difficulty].patterns}

Available nouns from current session: ${nounList}${usedPatterns}

Create a sentence pattern drill where the user fills in blanks with the appropriate article and noun from the provided list.

REQUIREMENTS:
- Use ONLY the nouns provided in the list above
- Create varied, interesting sentence patterns appropriate for ${difficulty} level
- Generate blanks that test article usage and noun selection
- Provide multiple correct example answers using different nouns from the list

Return JSON in this exact format:
{
  "id": "drill_${seed}",
  "pattern": "[sentence with ___ blanks]",
  "blanks": ["article", "noun"],
  "difficulty": "${difficulty}",
  "expectedAnswers": ["[example 1]", "[example 2]", "[example 3]"]
}

Generate 3-5 expected answers using different nouns from the provided list only.`;
        responseFormat = 'Return only valid JSON without markdown formatting or code blocks. No additional text or explanations.';
        break;

      case 'explanation':
        if (!noun) {
          throw new Error('No noun provided for explanation');
        }

        prompt = `Explain why the German noun "${noun.word}" has the article "${noun.article}" in simple, clear terms.

Provide a helpful explanation that focuses on:
- Practical rules or patterns for remembering the gender
- Word endings or semantic categories when applicable
- Memorable tips for learners

Keep the explanation under 60 words and make it educational and encouraging.

Format: Provide a clear, direct explanation without introductory phrases.`;
        responseFormat = 'Return only the explanation text, no JSON, no markdown formatting.';
        break;

      case 'evaluation':
        if (!pattern || !expectedAnswer || !userSpeech) {
          throw new Error('Missing required parameters for evaluation');
        }

        prompt = `Evaluate this German speech attempt:

Pattern: "${pattern}"
Expected: "${expectedAnswer}"
User said: "${userSpeech}"

Analyze the user's response for:
1. Grammar correctness (article usage, word order)
2. Vocabulary accuracy
3. Missing or incorrect elements
4. Overall comprehension

Provide constructive, encouraging feedback that helps the learner improve.

Return JSON in this exact format:
{
  "isCorrect": [true/false],
  "feedback": "[Encouraging feedback message]",
  "corrections": ["[specific correction 1]", "[specific correction 2]"]
}

Be supportive and specific about what they did well and what needs improvement.`;
        responseFormat = 'Return only valid JSON without markdown formatting or code blocks. No additional text or explanations.';
        break;

      case 'loading-status':
        // Return immediate loading status response
        return new Response(JSON.stringify({
          status: 'loading',
          message: 'Generating fresh German vocabulary...',
          timestamp: Date.now()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Invalid request type: ${type}`);
    }

    // Make the API call with increased temperature for more variety
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
            content: `You are a German language learning assistant specializing in generating varied, authentic vocabulary. ${responseFormat} Always ensure maximum variety and avoid repetitive examples.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9, // High temperature for maximum variety
        max_tokens: 1200,
        presence_penalty: 0.6, // Discourage repetitive content
        frequency_penalty: 0.8, // Further reduce repetition
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let result;
    try {
      if (type === 'explanation') {
        result = { 
          explanation: content.trim(),
          timestamp: Date.now()
        };
      } else if (type === 'nouns') {
        const cleanedContent = cleanJsonResponse(content);
        const parsedNouns = JSON.parse(cleanedContent);
        
        // Validate that we got the expected number of nouns
        if (!Array.isArray(parsedNouns) || parsedNouns.length !== count) {
          throw new Error('Invalid noun count returned from API');
        }
        
        result = { 
          nouns: parsedNouns,
          generated: Date.now(),
          seed: seed
        };
      } else if (type === 'pattern') {
        const cleanedContent = cleanJsonResponse(content);
        const parsedDrill = JSON.parse(cleanedContent);
        
        result = { 
          drill: parsedDrill,
          generated: Date.now(),
          seed: seed
        };
      } else if (type === 'evaluation') {
        const cleanedContent = cleanJsonResponse(content);
        const parsedEval = JSON.parse(cleanedContent);
        
        result = { 
          evaluation: parsedEval,
          processed: Date.now()
        };
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw content:', content);
      throw new Error(`Failed to parse API response: ${parseError.message}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in German learning API:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: Date.now(),
      type: 'server_error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});