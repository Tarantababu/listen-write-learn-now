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

// Helper function to clean and extract JSON from response
function cleanJsonResponse(content: string): string {
  // Remove markdown code blocks
  let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove any text before the first [ or {
  const jsonStart = Math.min(
    cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('['),
    cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{')
  );
  
  if (jsonStart !== Infinity && jsonStart > 0) {
    cleaned = cleaned.substring(jsonStart);
  }
  
  // Remove any text after the last ] or }
  const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  if (lastBracket !== -1 && lastBracket < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastBracket + 1);
  }
  
  return cleaned.trim();
}

// Helper function to attempt JSON parsing with fallback
function safeJsonParse(content: string, type: string): any {
  try {
    const cleaned = cleanJsonResponse(content);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(`JSON parsing failed for type ${type}:`, error);
    console.error('Cleaned content:', cleanJsonResponse(content));
    console.error('Raw content:', content);
    
    // Try to extract JSON manually for common patterns
    if (type === 'nouns' && content.includes('"word"')) {
      // Attempt to extract array from malformed response
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e) {
          console.error('Manual extraction failed:', e);
        }
      }
    }
    
    throw new Error(`Invalid JSON response from OpenAI: ${error.message}`);
  }
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
        prompt = `Generate exactly ${count} different German nouns with their articles and English meanings for ${difficulty} level learners.

${DIFFICULTY_PROMPTS[difficulty].nouns}

CRITICAL: Avoid common textbook words like Tisch, Lampe, Buch, Stuhl, Katze, Haus.

You must respond with a JSON object containing a "nouns" array:

{
  "nouns": [
    {
      "id": "noun_1",
      "word": "German_word",
      "article": "der/die/das",
      "meaning": "English_meaning",
      "difficulty": "${difficulty}"
    }
  ]
}

Generate ${count} unique German nouns with varied genders and categories.`;
        responseFormat = 'Return only a JSON object with a "nouns" array. No markdown, no explanations, just valid JSON.';
        break;

      case 'pattern':
        if (!nouns || nouns.length === 0) {
          throw new Error('No nouns provided for pattern generation');
        }
        
        const nounList = nouns.map((n: any) => `${n.article} ${n.word} (${n.meaning})`).join(', ');
        const usedPatterns = previousPatterns && previousPatterns.length > 0 ? 
          `\nAvoid these previously used patterns: ${previousPatterns.join(', ')}` : '';
        
        prompt = `Create a sentence pattern drill using these German nouns: ${nounList}${usedPatterns}

${DIFFICULTY_PROMPTS[difficulty].patterns}

You must respond with this JSON structure:

{
  "drill": {
    "id": "drill_${seed}",
    "pattern": "sentence with ___ blanks",
    "blanks": ["article", "noun"],
    "difficulty": "${difficulty}",
    "expectedAnswers": ["answer1", "answer2", "answer3"]
  }
}

Use only the provided nouns and create 3-5 example answers.`;
        responseFormat = 'Return only a JSON object with a "drill" property. No markdown, no explanations.';
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

You must respond with this JSON structure:

{
  "evaluation": {
    "isCorrect": true/false,
    "feedback": "encouraging message",
    "corrections": ["correction1", "correction2"]
  }
}

Analyze grammar, article usage, word order, and vocabulary accuracy.`;
        responseFormat = 'Return only a JSON object with an "evaluation" property. No markdown, no explanations.';
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
            content: `You are a German language learning assistant. ${responseFormat} CRITICAL: Your response must be valid JSON only. Do not include any explanations, markdown formatting, or additional text outside the JSON structure.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7, // Reduced slightly for more consistent JSON formatting
        max_tokens: 1200,
        presence_penalty: 0.6,
        frequency_penalty: 0.8,
        response_format: type !== 'explanation' ? { type: "json_object" } : undefined, // Force JSON mode for structured responses
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
        const parsedResponse = safeJsonParse(content, 'nouns');
        
        // Handle both array and object responses
        let nounsArray;
        if (Array.isArray(parsedResponse)) {
          nounsArray = parsedResponse;
        } else if (parsedResponse.nouns && Array.isArray(parsedResponse.nouns)) {
          nounsArray = parsedResponse.nouns;
        } else {
          throw new Error('Response must contain either an array or an object with a "nouns" array property');
        }
        
        // Validate that we got some nouns
        if (!nounsArray || nounsArray.length === 0) {
          throw new Error('No nouns found in API response');
        }
        
        // Validate noun structure
        const validNouns = nounsArray.filter(noun => 
          noun && typeof noun === 'object' && 
          noun.word && noun.article && noun.meaning
        );
        
        if (validNouns.length === 0) {
          throw new Error('No valid nouns found in API response');
        }
        
        result = { 
          nouns: validNouns,
          generated: Date.now(),
          seed: seed
        };
      } else if (type === 'pattern') {
        const parsedResponse = safeJsonParse(content, 'pattern');
        
        // Handle both direct drill and wrapped drill responses
        let drillData;
        if (parsedResponse.drill) {
          drillData = parsedResponse.drill;
        } else if (parsedResponse.pattern) {
          drillData = parsedResponse;
        } else {
          throw new Error('Response must contain drill data');
        }
        
        // Validate drill structure
        if (!drillData.pattern || !drillData.expectedAnswers) {
          throw new Error('Invalid drill structure: missing pattern or expectedAnswers');
        }
        
        result = { 
          drill: drillData,
          generated: Date.now(),
          seed: seed
        };
      } else if (type === 'evaluation') {
        const parsedResponse = safeJsonParse(content, 'evaluation');
        
        // Handle both direct evaluation and wrapped evaluation responses
        let evalData;
        if (parsedResponse.evaluation) {
          evalData = parsedResponse.evaluation;
        } else if (typeof parsedResponse.isCorrect === 'boolean') {
          evalData = parsedResponse;
        } else {
          throw new Error('Response must contain evaluation data');
        }
        
        // Validate evaluation structure
        if (typeof evalData.isCorrect !== 'boolean') {
          throw new Error('Invalid evaluation structure: isCorrect must be boolean');
        }
        
        result = { 
          evaluation: evalData,
          processed: Date.now()
        };
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw content:', content);
      
      // Return a more informative error
      throw new Error(`Failed to parse API response for ${type}: ${parseError.message}. Check server logs for full content.`);
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