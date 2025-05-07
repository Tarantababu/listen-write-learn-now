
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VocabularyResponse {
  sentences: {
    text: string;
    analysis: {
      words: {
        word: string;
        definition: string;
        etymologyInsight?: string;
        englishCousin?: string;
      }[];
      grammarInsights: string[];
      structure: string;
    };
  }[];
  commonPatterns: string[];
  summary: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language } = await req.json();

    if (!text || !language) {
      return new Response(
        JSON.stringify({ error: 'Both text and language are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check text length
    if (text.length > 3000) {
      return new Response(
        JSON.stringify({ error: 'Text exceeds maximum length of 3000 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const prompt = `
You are a language learning assistant helping users understand a text in ${language}. 
Split the provided text into sentences and provide a detailed analysis for each.

For each sentence:
1. Analyze key words (include their definition)
2. For at least 2-3 key words, provide "English cousins" - similar words in English (if applicable)
3. Share brief etymological insights where interesting
4. Explain basic grammar patterns and sentence structure
5. Note any idiomatic expressions

After analyzing each sentence, provide:
1. Summary of 2-3 common patterns or structures seen across the text
2. A brief overall summary of what the text is about

Format the response as a JSON object with the structure shown in the example below.
Do not include any text outside of the JSON, no markdown formatting, no code blocks, just pure JSON.

Example format:
{
  "sentences": [
    {
      "text": "Original sentence in target language",
      "analysis": {
        "words": [
          {
            "word": "word1",
            "definition": "meaning",
            "etymologyInsight": "brief origin",
            "englishCousin": "similar English word"
          }
        ],
        "grammarInsights": ["insight 1", "insight 2"],
        "structure": "description of sentence structure"
      }
    }
  ],
  "commonPatterns": ["pattern 1", "pattern 2"],
  "summary": "Brief content summary"
}

Here's the text to analyze:
${text}
`;

    console.log(`Generating reading analysis for text in ${language} (length: ${text.length})`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a language learning assistant providing detailed analysis of texts.',
          },
          {
            role: 'user',
            content: prompt,
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Error generating reading analysis', details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const data = await response.json();
    let analysisContent: VocabularyResponse;
    
    try {
      // Get the content from ChatGPT response
      const contentText = data.choices[0].message.content;
      
      // Check if the response contains markdown code blocks and extract the JSON
      let jsonText = contentText;
      
      // Remove markdown code blocks if present
      const markdownMatch = contentText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch && markdownMatch[1]) {
        jsonText = markdownMatch[1];
      }
      
      // Try to parse the JSON
      analysisContent = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Error parsing reading analysis', 
          rawResponse: data.choices[0].message.content 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        analysis: analysisContent,
        usage: data.usage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
