
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANGUAGE_SPECIFIC_PROMPTS = {
  german: {
    nouns: {
      simple: "Generate common, everyday German nouns with their articles (der/die/das) for beginners. Focus on household items, basic animals, food, family members, body parts, clothing. Include gender explanation hints when helpful.",
      normal: "Generate intermediate German nouns including abstract concepts, workplace items, technology terms. Mix common and moderately challenging words from various domains.",
      complex: "Generate advanced German nouns including technical terms, literary vocabulary, complex abstract concepts, compound words with multiple parts."
    },
    patterns: {
      simple: "Create simple German sentence patterns using 'Das ist ein/eine' structure with correct articles. Focus on nominative case and basic vocabulary.",
      normal: "Create German sentence patterns with possessive articles (mein/meine) and basic verbs. Include accusative case patterns like 'Ich sehe den/die/das ___'.",
      complex: "Create complex German sentence patterns with multiple cases, adjective declensions, and subordinate clauses. Include dative and genitive cases."
    }
  },
  french: {
    nouns: {
      simple: "Generate common French nouns with their articles (le/la/les) for beginners. Focus on everyday vocabulary with clear gender patterns.",
      normal: "Generate intermediate French nouns including contractions (au, du) and liaison-sensitive words. Mix vocabulary that requires pronunciation awareness.",
      complex: "Generate advanced French nouns with complex contractions, literary vocabulary, and words that demonstrate liaison rules."
    },
    patterns: {
      simple: "Create simple French sentence patterns using 'C'est un/une ___' with correct articles and gender agreement.",
      normal: "Create French sentence patterns with contractions like 'Je vais à ___' (checking for au/du). Include present tense verb patterns.",
      complex: "Create complex French sentence patterns with subjunctive mood, complex contractions, and liaison-sensitive constructions."
    }
  },
  spanish: {
    nouns: {
      simple: "Generate common Spanish nouns with their articles (el/la/los/las) for beginners. Focus on clear gender patterns and everyday vocabulary.",
      normal: "Generate intermediate Spanish nouns including irregular plurals and words that require verb conjugation awareness.",
      complex: "Generate advanced Spanish nouns including technical terms, irregular forms, and vocabulary that works with complex verb tenses."
    },
    patterns: {
      simple: "Create simple Spanish sentence patterns using 'Tengo un/una ___' with correct gender agreement.",
      normal: "Create Spanish sentence patterns with verb conjugation like 'Ella ___ todos los días' focusing on present tense regular and irregular verbs.",
      complex: "Create complex Spanish sentence patterns with subjunctive, conditional, and reflexive verb forms."
    }
  },
  italian: {
    nouns: {
      simple: "Generate common Italian nouns with their articles (il/lo/la/l'/gli/le) for beginners. Focus on article contraction rules.",
      normal: "Generate intermediate Italian nouns including preposition contractions (del, nel, sul) and adjective agreement patterns.",
      complex: "Generate advanced Italian nouns with complex contractions, pronouns like 'ci' and 'ne', and literary vocabulary."
    },
    patterns: {
      simple: "Create simple Italian sentence patterns using 'Questo è ___' with correct article selection (il/lo/la/l').",
      normal: "Create Italian sentence patterns with adjective agreement like 'Il ragazzo alto' and preposition contractions.",
      complex: "Create complex Italian sentence patterns with pronouns 'ci' and 'ne', complex contractions, and subjunctive mood."
    }
  },
  portuguese: {
    nouns: {
      simple: "Generate common Portuguese nouns with their articles (o/a/os/as) for beginners. Focus on clear gender patterns and nasal sound examples.",
      normal: "Generate intermediate Portuguese nouns including words with nasal vowels and verb tense variety examples.",
      complex: "Generate advanced Portuguese nouns with complex nasal sounds, literary vocabulary, and irregular forms."
    },
    patterns: {
      simple: "Create simple Portuguese sentence patterns using 'Eu tenho um/uma ___' with correct gender agreement.",
      normal: "Create Portuguese sentence patterns with verb conjugation like 'Eles ___ todos os dias' focusing on regular and irregular verbs.",
      complex: "Create complex Portuguese sentence patterns with subjunctive mood, complex verb tenses, and nasal sound pronunciation challenges."
    }
  },
  english: {
    nouns: {
      simple: "Generate common English nouns for beginners. Focus on countable vs uncountable, basic plural forms.",
      normal: "Generate intermediate English nouns including irregular plurals and words that work with different verb tenses.",
      complex: "Generate advanced English nouns including technical terms, abstract concepts, and words for complex grammar structures."
    },
    patterns: {
      simple: "Create simple English sentence patterns focusing on 'He/She ___ a book' with correct verb agreement (has vs have).",
      normal: "Create English sentence patterns with continuous tenses like 'I am ___ to school' and correct preposition use.",
      complex: "Create complex English sentence patterns with passive voice, reported speech, and conditional structures."
    }
  },
  dutch: {
    nouns: {
      simple: "Generate common Dutch nouns with their articles (de/het) for beginners. Focus on gender patterns and everyday vocabulary.",
      normal: "Generate intermediate Dutch nouns including separable verb combinations and word order challenges.",
      complex: "Generate advanced Dutch nouns for complex word order patterns, subordinate clauses, and separable verb constructions."
    },
    patterns: {
      simple: "Create simple Dutch sentence patterns using 'Ik zie ___' with correct article (de/het) application.",
      normal: "Create Dutch sentence patterns with separable verbs like 'Ik wil ___ maken' and basic word order.",
      complex: "Create complex Dutch sentence patterns with inverted word order in subordinate clauses and V2 rule applications."
    }
  },
  turkish: {
    nouns: {
      simple: "Generate common Turkish nouns for beginners. Focus on vowel harmony patterns and basic vocabulary (no articles needed).",
      normal: "Generate intermediate Turkish nouns including words that demonstrate vowel harmony and basic suffix patterns.",
      complex: "Generate advanced Turkish nouns with complex vowel harmony, agglutinative suffixes, and technical vocabulary."
    },
    patterns: {
      simple: "Create simple Turkish sentence patterns using 'Ben ___ gidiyorum' with correct suffix application (locative, dative).",
      normal: "Create Turkish sentence patterns like 'Kitabı ___' focusing on correct suffix usage and vowel harmony.",
      complex: "Create complex Turkish sentence patterns with multiple agglutinative suffixes and SOV word order challenges."
    }
  },
  swedish: {
    nouns: {
      simple: "Generate common Swedish nouns with their articles (en/ett) for beginners. Focus on gender patterns and everyday vocabulary.",
      normal: "Generate intermediate Swedish nouns including definite forms and words for V2 rule practice.",
      complex: "Generate advanced Swedish nouns for complex definite forms, adjective agreement, and verb-second rule applications."
    },
    patterns: {
      simple: "Create simple Swedish sentence patterns using 'Det är en/ett ___' with correct gender article selection.",
      normal: "Create Swedish sentence patterns with definite forms like 'den/det ___ noun' and adjective agreement.",
      complex: "Create complex Swedish sentence patterns with verb-second rule applications and complex definite constructions."
    }
  },
  norwegian: {
    nouns: {
      simple: "Generate common Norwegian nouns with their articles (en/ei/et) for beginners. Focus on three-gender system and basic vocabulary.",
      normal: "Generate intermediate Norwegian nouns including definite vs indefinite forms and tonal accent examples.",
      complex: "Generate advanced Norwegian nouns with complex definite forms, bokmål/nynorsk variations, and technical vocabulary."
    },
    patterns: {
      simple: "Create simple Norwegian sentence patterns using 'En/ei/et ___' with correct three-gender article selection.",
      normal: "Create Norwegian sentence patterns like 'Jeg har ___' with correct word order and definite forms.",
      complex: "Create complex Norwegian sentence patterns with advanced definite constructions and bokmål/nynorsk considerations."
    }
  }
};

const DIFFICULTY_PROMPTS = {
  simple: {
    nouns: "Generate common, everyday nouns that beginners should know. Focus on the most frequently used words that beginners encounter first. Vary your selection to include different categories. NEVER use the same words twice - always provide fresh, different vocabulary.",
    patterns: "Create simple sentence patterns using basic structures. Keep vocabulary basic and sentences short."
  },
  normal: {
    nouns: "Generate intermediate nouns including abstract concepts, more specific categories. Mix common and moderately challenging words from various domains. ALWAYS provide unique, varied vocabulary - never repeat the same examples.",
    patterns: "Create sentence patterns with more complex structures and intermediate vocabulary. Include some compound sentences."
  },
  complex: {
    nouns: "Generate advanced nouns including technical terms, literary vocabulary, complex abstract concepts. Challenge the learner with sophisticated vocabulary. Ensure maximum variety in word selection.",
    patterns: "Create complex sentence patterns with advanced structures and sophisticated vocabulary."
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
    const { type, difficulty, nouns, count, noun, expectedAnswer, userSpeech, pattern, previousPatterns, sessionId, language = 'german' } = await req.json();

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt = '';
    let responseFormat = '';
    const seed = generateSeed();

    // Get language-specific prompts or fall back to defaults
    const langPrompts = LANGUAGE_SPECIFIC_PROMPTS[language.toLowerCase()] || LANGUAGE_SPECIFIC_PROMPTS.german;
    const difficultyPrompts = langPrompts[type] || DIFFICULTY_PROMPTS;

    switch (type) {
      case 'nouns':
        const nounPrompt = difficultyPrompts[difficulty] || DIFFICULTY_PROMPTS[difficulty].nouns;
        
        prompt = `Generate exactly ${count} different ${language} nouns with their articles and English meanings for ${difficulty} level learners.

${nounPrompt}

CRITICAL: Avoid common textbook words. Focus on the unique aspects of ${language} grammar and vocabulary.

You must respond with a JSON object containing a "nouns" array:

{
  "nouns": [
    {
      "id": "noun_1",
      "word": "${language}_word",
      "article": "appropriate_article_for_${language}",
      "meaning": "English_meaning",
      "difficulty": "${difficulty}"
    }
  ]
}

Generate ${count} unique ${language} nouns with varied genders and categories.`;
        responseFormat = 'Return only a JSON object with a "nouns" array. No markdown, no explanations, just valid JSON.';
        break;

      case 'pattern':
        if (!nouns || nouns.length === 0) {
          throw new Error('No nouns provided for pattern generation');
        }
        
        const nounList = nouns.map((n: any) => `${n.article} ${n.word} (${n.meaning})`).join(', ');
        const usedPatterns = previousPatterns && previousPatterns.length > 0 ? 
          `\nAvoid these previously used patterns: ${previousPatterns.join(', ')}` : '';
        
        const patternPrompt = difficultyPrompts[difficulty] || DIFFICULTY_PROMPTS[difficulty].patterns;
        
        prompt = `Create a ${language} sentence pattern drill using these nouns: ${nounList}${usedPatterns}

${patternPrompt}

Focus on the unique grammar challenges of ${language} language. Create patterns that help learners practice the most important grammatical concepts.

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

        prompt = `Explain why the ${language} noun "${noun.word}" has the article "${noun.article}" in simple, clear terms.

Provide a helpful explanation that focuses on:
- Practical rules or patterns for remembering the gender/article in ${language}
- Word endings or semantic categories specific to ${language} when applicable
- Memorable tips for ${language} learners

Keep the explanation under 60 words and make it educational and encouraging.

Format: Provide a clear, direct explanation without introductory phrases.`;
        responseFormat = 'Return only the explanation text, no JSON, no markdown formatting.';
        break;

      case 'evaluation':
        if (!pattern || !expectedAnswer || !userSpeech) {
          throw new Error('Missing required parameters for evaluation');
        }

        prompt = `Evaluate this ${language} speech attempt:

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

Analyze grammar, article usage, word order, and vocabulary accuracy specific to ${language} language rules.`;
        responseFormat = 'Return only a JSON object with an "evaluation" property. No markdown, no explanations.';
        break;

      case 'loading-status':
        // Return immediate loading status response
        return new Response(JSON.stringify({
          status: 'loading',
          message: `Generating fresh ${language} vocabulary...`,
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
            content: `You are a ${language} language learning assistant specializing in the unique grammar challenges of ${language}. ${responseFormat} CRITICAL: Your response must be valid JSON only. Do not include any explanations, markdown formatting, or additional text outside the JSON structure.`
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
          seed: seed,
          language: language
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
          seed: seed,
          language: language
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
          processed: Date.now(),
          language: language
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
    console.error('Error in language learning API:', error);
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
