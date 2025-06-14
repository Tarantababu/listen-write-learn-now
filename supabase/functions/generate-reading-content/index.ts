
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      topic, 
      language, 
      difficulty_level, 
      target_length, 
      grammar_focus,
      customText,
      isCustomText = false
    } = await req.json()

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    let content;

    if (isCustomText && customText) {
      // Process custom text
      content = await processCustomText(customText, language, difficulty_level, grammar_focus);
    } else {
      // Use chunking strategy for large content generation
      if (target_length > 1500) {
        content = await generateContentInChunks(topic, language, difficulty_level, target_length, grammar_focus);
      } else {
        content = await generateAIContentWithRetry(topic, language, difficulty_level, target_length, grammar_focus);
      }
    }

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in generate-reading-content function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateContentInChunks(topic: string, language: string, difficulty_level: string, target_length: number, grammar_focus?: string) {
  console.log(`Generating content in chunks for target length: ${target_length}`);
  
  // Calculate optimal chunk size
  const chunkSize = Math.min(800, Math.max(400, Math.floor(target_length / 3)));
  const numChunks = Math.ceil(target_length / chunkSize);
  
  console.log(`Using ${numChunks} chunks of ~${chunkSize} words each`);
  
  const chunks = [];
  let totalWordCount = 0;
  
  // Generate story outline first with fallback
  let outline;
  try {
    outline = await generateStoryOutline(topic, language, difficulty_level, target_length, numChunks, grammar_focus);
  } catch (error) {
    console.warn('Story outline generation failed, using fallback approach:', error);
    // Fallback: create a simple outline
    outline = {
      sections: Array.from({ length: numChunks }, (_, i) => `${topic} - Part ${i + 1} of ${numChunks}`),
      characters: ['main character'],
      setting: `story about ${topic}`
    };
  }
  
  for (let i = 0; i < numChunks; i++) {
    const chunkTopic = outline.sections[i] || `${topic} - Part ${i + 1}`;
    const isLastChunk = i === numChunks - 1;
    const adjustedChunkSize = isLastChunk ? target_length - totalWordCount : chunkSize;
    
    if (adjustedChunkSize <= 0) break;
    
    console.log(`Generating chunk ${i + 1}/${numChunks}: ${adjustedChunkSize} words`);
    
    const chunk = await generateSingleChunk(
      chunkTopic, 
      language, 
      difficulty_level, 
      adjustedChunkSize, 
      grammar_focus,
      i === 0, // isFirstChunk
      isLastChunk,
      i > 0 ? chunks[chunks.length - 1] : null // previousChunk for continuity
    );
    
    chunks.push(chunk);
    totalWordCount += chunk.analysis?.wordCount || 0;
    
    // Add small delay between chunks to avoid rate limits
    if (i < numChunks - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Combine chunks into final content
  return combineChunks(chunks, target_length);
}

async function generateStoryOutline(topic: string, language: string, difficulty_level: string, target_length: number, numChunks: number, grammar_focus?: string) {
  console.log('Generating story outline');
  
  const prompt = `Create a story outline for a ${target_length}-word ${language} text about "${topic}" for ${difficulty_level} level learners.

The story should be divided into ${numChunks} sections. Each section should:
- Flow naturally into the next
- Be approximately ${Math.floor(target_length / numChunks)} words
- Maintain consistent characters and setting
${grammar_focus ? `- Incorporate these grammar points: ${grammar_focus}` : ''}

Return ONLY a JSON object in this format:
{
  "sections": [
    "Section 1 description and key events",
    "Section 2 description and key events",
    ...
  ],
  "characters": ["main character names"],
  "setting": "where the story takes place"
}`;

  try {
    // callOpenAI already returns parsed JSON, so no need to JSON.parse again
    const outline = await callOpenAI(prompt, 800);
    
    // Validate the outline structure
    if (!outline || typeof outline !== 'object') {
      throw new Error('Invalid outline format: not an object');
    }
    
    if (!outline.sections || !Array.isArray(outline.sections) || outline.sections.length === 0) {
      throw new Error('Invalid outline format: missing or empty sections array');
    }
    
    // Ensure we have the right number of sections
    if (outline.sections.length < numChunks) {
      console.warn(`Outline has ${outline.sections.length} sections, expected ${numChunks}. Padding with generic sections.`);
      while (outline.sections.length < numChunks) {
        outline.sections.push(`${topic} - Additional section ${outline.sections.length + 1}`);
      }
    }
    
    console.log(`Generated outline with ${outline.sections.length} sections`);
    return outline;
  } catch (error) {
    console.error('Error generating story outline:', error);
    throw error;
  }
}

async function generateSingleChunk(
  chunkTopic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  isFirstChunk: boolean = false,
  isLastChunk: boolean = false,
  previousChunk: any = null
) {
  const contextInfo = previousChunk ? 
    `Continue this story from where it left off. Previous section ended with: "${previousChunk.sentences[previousChunk.sentences.length - 1]?.text || ''}"` :
    '';
    
  const prompt = `${isFirstChunk ? 'Start' : 'Continue'} a ${language} story for ${difficulty_level} level learners.

${contextInfo}

Topic: ${chunkTopic}
TARGET WORD COUNT: EXACTLY ${target_length} words
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

Requirements:
1. Write EXACTLY ${target_length} words
2. Create 4-8 natural sentences
3. ${isFirstChunk ? 'Introduce characters and setting' : 'Continue the narrative flow'}
4. ${isLastChunk ? 'Provide a satisfying conclusion' : 'End with continuity for the next section'}
5. Use vocabulary appropriate for ${difficulty_level} level
6. Each sentence should have comprehensive word analysis

Return ONLY valid JSON in this format:
{
  "sentences": [
    {
      "id": "sentence-1",
      "text": "sentence text in ${language}",
      "analysis": {
        "words": [
          {
            "word": "word",
            "definition": "clear definition",
            "partOfSpeech": "noun/verb/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["grammar points in this sentence"],
        "translation": "English translation"
      }
    }
  ],
  "analysis": {
    "wordCount": ${target_length},
    "readingTime": ${Math.ceil(target_length / 200)},
    "grammarPoints": ["grammar concepts covered"]
  }
}`;

  const maxTokens = Math.min(4000, Math.max(1500, target_length * 3));
  return await callOpenAI(prompt, maxTokens);
}

function combineChunks(chunks: any[], target_length: number) {
  console.log(`Combining ${chunks.length} chunks`);
  
  const allSentences = [];
  const allGrammarPoints = new Set();
  let totalWordCount = 0;
  let sentenceCounter = 1;
  
  for (const chunk of chunks) {
    if (chunk.sentences) {
      for (const sentence of chunk.sentences) {
        allSentences.push({
          ...sentence,
          id: `sentence-${sentenceCounter++}`
        });
        
        if (sentence.analysis?.grammar) {
          sentence.analysis.grammar.forEach((point: string) => allGrammarPoints.add(point));
        }
      }
      
      totalWordCount += chunk.analysis?.wordCount || 0;
    }
  }
  
  return {
    sentences: allSentences,
    analysis: {
      wordCount: totalWordCount,
      readingTime: Math.ceil(totalWordCount / 200),
      grammarPoints: Array.from(allGrammarPoints)
    }
  };
}

async function processCustomText(customText: string, language: string, difficulty_level: string, grammar_focus?: string) {
  const prompt = `Analyze and enhance this custom text for ${difficulty_level} level ${language} learners.

Original text: "${customText}"
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

Requirements:
1. Break the text into 5-12 natural sentences
2. Provide comprehensive analysis for each sentence
3. Keep original meaning and style
4. Fix obvious errors while preserving author's voice

Return ONLY valid JSON in this format:
{
  "sentences": [
    {
      "id": "sentence-1",
      "text": "sentence text in ${language}",
      "analysis": {
        "words": [
          {
            "word": "word",
            "definition": "clear definition",
            "partOfSpeech": "noun/verb/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["grammar points in this sentence"],
        "translation": "English translation"
      }
    }
  ],
  "analysis": {
    "wordCount": ${customText.split(' ').length},
    "readingTime": ${Math.ceil(customText.split(' ').length / 200)},
    "grammarPoints": ["grammar concepts covered"]
  }
}`;

  return await callOpenAI(prompt, 3000);
}

async function generateAIContentWithRetry(topic: string, language: string, difficulty_level: string, target_length: number, grammar_focus?: string) {
  const maxRetries = 2; // Reduced retries for better performance
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`Generating content attempt ${attempt + 1}/${maxRetries} for ${target_length} words`);
      
      const content = await generateAIContent(topic, language, difficulty_level, target_length, grammar_focus);
      
      // More lenient validation for smaller content
      const actualWordCount = content.analysis?.wordCount || 0;
      const minExpectedWords = Math.floor(target_length * 0.7); // Allow 30% variance
      
      console.log(`Generated ${actualWordCount} words, target: ${target_length}, minimum: ${minExpectedWords}`);
      
      if (actualWordCount >= minExpectedWords) {
        console.log('Word count validation passed');
        return content;
      } else {
        console.log(`Word count too low (${actualWordCount}/${minExpectedWords}), retrying...`);
        attempt++;
        
        if (attempt === maxRetries) {
          console.warn('Max retries reached, returning content with lower word count');
          return content;
        }
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      attempt++;
      
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}

async function generateAIContent(topic: string, language: string, difficulty_level: string, target_length: number, grammar_focus?: string) {
  const prompt = `Create an engaging reading exercise in ${language} for ${difficulty_level} level learners.

Topic: ${topic}
TARGET WORD COUNT: EXACTLY ${target_length} words
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

Requirements:
1. Write EXACTLY ${target_length} words across all sentences
2. Create 8-15 natural, flowing sentences
3. Include varied sentence structures
4. Make vocabulary appropriate for ${difficulty_level} level
5. Provide comprehensive word analysis
6. Include cultural authenticity

Return ONLY valid JSON in this format:
{
  "sentences": [
    {
      "id": "sentence-1",
      "text": "sentence text in ${language}",
      "analysis": {
        "words": [
          {
            "word": "word",
            "definition": "clear definition",
            "partOfSpeech": "noun/verb/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["grammar points in this sentence"],
        "translation": "English translation"
      }
    }
  ],
  "analysis": {
    "wordCount": ${target_length},
    "readingTime": ${Math.ceil(target_length / 200)},
    "grammarPoints": ["grammar concepts covered"]
  }
}`;

  // Optimized token calculation
  const baseTokens = 1500;
  const contentTokens = Math.ceil(target_length * 1.2);
  const analysisTokens = Math.ceil(target_length * 0.4);
  const maxTokens = Math.min(8000, baseTokens + contentTokens + analysisTokens);
  
  console.log(`Using optimized token limit: ${maxTokens} for target length: ${target_length}`);
  
  return await callOpenAI(prompt, maxTokens);
}

async function callOpenAI(prompt: string, maxTokens: number) {
  console.log(`Calling OpenAI with max_tokens: ${maxTokens}`);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert language teacher creating high-quality reading exercises. You create authentic, culturally relevant content perfectly calibrated for language learners. You MUST respond with valid JSON only, no additional text. Make sure every word in vocabulary analysis is present in the text. CRITICAL: Generate content that meets the exact word count specified.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`OpenAI API error: ${response.status} - ${errorText}`)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  console.log('Raw OpenAI response length:', content.length);

  let parsedContent
  try {
    parsedContent = JSON.parse(content)
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content.substring(0, 500) + '...')
    console.error('Parse error:', parseError.message)
    
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        parsedContent = JSON.parse(jsonMatch[0])
        console.log('Successfully extracted JSON from wrapped response')
      } catch (extractError) {
        console.error('Failed to extract JSON:', extractError.message)
        throw new Error('Failed to parse OpenAI response as JSON')
      }
    } else {
      throw new Error('No valid JSON found in OpenAI response')
    }
  }

  // Validate structure
  if (!parsedContent.sentences || !Array.isArray(parsedContent.sentences)) {
    throw new Error('Invalid response structure: missing sentences array')
  }

  // Add IDs and validate
  parsedContent.sentences = parsedContent.sentences.map((sentence: any, index: number) => ({
    ...sentence,
    id: sentence.id || `sentence-${index + 1}`,
    analysis: {
      words: sentence.analysis?.words || [],
      grammar: sentence.analysis?.grammar || [],
      translation: sentence.analysis?.translation || ''
    }
  }))

  // Calculate actual word count
  const actualWordCount = parsedContent.sentences.reduce((count: number, sentence: any) => {
    return count + (sentence.text?.split(' ').length || 0);
  }, 0);

  // Ensure analysis exists
  if (!parsedContent.analysis) {
    parsedContent.analysis = {
      wordCount: actualWordCount,
      readingTime: Math.ceil(actualWordCount / 200),
      grammarPoints: []
    }
  } else {
    parsedContent.analysis.wordCount = actualWordCount;
    parsedContent.analysis.readingTime = Math.ceil(actualWordCount / 200);
  }

  console.log(`Successfully processed content with ${actualWordCount} words`);
  return parsedContent;
}
