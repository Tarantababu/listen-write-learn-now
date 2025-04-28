
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word, language } = await req.json();

    if (!word || !language) {
      throw new Error('Word and language are required');
    }

    // Prepare the prompt based on the language
    const prompt = `
      Generate information about the word or phrase "${word}" in ${language}.
      
      Return the response in the following JSON format:
      {
        "definition": "A concise definition of the word",
        "exampleSentence": "An example sentence using the word naturally"
      }
      
      Make the definition clear and concise, suitable for language learners.
      Create an example sentence that shows natural usage in context.
      The example sentence should be simple enough for language learners.
      Return only valid JSON without any additional text or formatting.
    `;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful language learning assistant.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error('Failed to generate vocabulary information');
    }
    
    // Extract the JSON content from the completion
    const completion = responseData.choices[0]?.message?.content;
    const vocabInfo = JSON.parse(completion);

    return new Response(
      JSON.stringify({
        definition: vocabInfo.definition,
        exampleSentence: vocabInfo.exampleSentence
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error generating vocabulary info:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
