

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
      // Use enhanced chunking strategy for large content generation
      if (target_length > 1500) {
        content = await generateContentWithEnhancedChunking(topic, language, difficulty_level, target_length, grammar_focus);
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

async function generateContentWithEnhancedChunking(topic: string, language: string, difficulty_level: string, target_length: number, grammar_focus?: string) {
  console.log(`Enhanced chunking for target length: ${target_length}`);
  
  // Optimized chunk sizing based on content length
  const chunkSize = calculateOptimalChunkSize(target_length);
  const numChunks = Math.ceil(target_length / chunkSize);
  
  console.log(`Using ${numChunks} chunks of ~${chunkSize} words each`);
  
  const chunks = [];
  let totalWordCount = 0;
  
  // Generate enhanced story outline with better error handling
  let outline;
  try {
    outline = await generateEnhancedStoryOutline(topic, language, difficulty_level, target_length, numChunks, grammar_focus);
  } catch (error) {
    console.warn('Enhanced outline generation failed, using intelligent fallback:', error);
    outline = createIntelligentFallbackOutline(topic, numChunks);
  }
  
  for (let i = 0; i < numChunks; i++) {
    const chunkTopic = outline.sections[i] || `${topic} - Part ${i + 1}`;
    const isLastChunk = i === numChunks - 1;
    const adjustedChunkSize = isLastChunk ? target_length - totalWordCount : chunkSize;
    
    if (adjustedChunkSize <= 0) break;
    
    console.log(`Generating enhanced chunk ${i + 1}/${numChunks}: ${adjustedChunkSize} words`);
    
    const chunk = await generateEnhancedChunk(
      chunkTopic, 
      language, 
      difficulty_level, 
      adjustedChunkSize, 
      grammar_focus,
      i === 0,
      isLastChunk,
      i > 0 ? chunks[chunks.length - 1] : null,
      outline
    );
    
    chunks.push(chunk);
    totalWordCount += chunk.analysis?.wordCount || 0;
    
    // Progressive delay to avoid rate limits
    if (i < numChunks - 1) {
      await new Promise(resolve => setTimeout(resolve, Math.min(1000, 200 + i * 100)));
    }
  }
  
  return combineChunksWithValidation(chunks, target_length);
}

function calculateOptimalChunkSize(target_length: number): number {
  // Optimized chunk sizing for better token management
  if (target_length <= 2000) return Math.min(600, Math.max(300, Math.floor(target_length / 3)));
  if (target_length <= 3000) return Math.min(700, Math.max(400, Math.floor(target_length / 4)));
  return Math.min(800, Math.max(500, Math.floor(target_length / 5)));
}

function createIntelligentFallbackOutline(topic: string, numChunks: number) {
  const narrativeStructure = [
    'Introduction and setting',
    'Character development',
    'Rising action',
    'Climax or main event',
    'Resolution and conclusion'
  ];
  
  const sections = [];
  for (let i = 0; i < numChunks; i++) {
    const structureIndex = Math.floor((i / numChunks) * narrativeStructure.length);
    const structureElement = narrativeStructure[Math.min(structureIndex, narrativeStructure.length - 1)];
    sections.push(`${topic} - ${structureElement} (Part ${i + 1})`);
  }
  
  return {
    sections,
    characters: ['protagonist', 'supporting character'],
    setting: `narrative about ${topic}`
  };
}

async function generateEnhancedStoryOutline(topic: string, language: string, difficulty_level: string, target_length: number, numChunks: number, grammar_focus?: string) {
  console.log('Generating enhanced story outline');
  
  const prompt = `Create a detailed story outline for a ${target_length}-word ${language} text about "${topic}" for ${difficulty_level} level learners.

Structure requirements:
- Divide into exactly ${numChunks} coherent sections
- Each section: ~${Math.floor(target_length / numChunks)} words
- Maintain narrative flow and character consistency
${grammar_focus ? `- Integrate grammar elements: ${grammar_focus}` : ''}

Return ONLY this JSON structure:
{
  "sections": [
    "Detailed description of section 1 events and focus",
    "Detailed description of section 2 events and focus",
    (continue for all ${numChunks} sections)
  ],
  "characters": ["main character names with brief descriptions"],
  "setting": "detailed setting description",
  "theme": "central theme of the story"
}`;

  try {
    // Increased token limit for better outline generation
    const outline = await callOpenAIWithEnhancedParsing(prompt, 1200);
    
    if (!outline || typeof outline !== 'object') {
      throw new Error('Invalid outline format');
    }
    
    if (!outline.sections || !Array.isArray(outline.sections)) {
      throw new Error('Missing sections array');
    }
    
    // Ensure correct number of sections
    while (outline.sections.length < numChunks) {
      outline.sections.push(`${topic} - Additional content section ${outline.sections.length + 1}`);
    }
    
    console.log(`Enhanced outline generated with ${outline.sections.length} sections`);
    return outline;
  } catch (error) {
    console.error('Enhanced outline generation failed:', error);
    throw error;
  }
}

async function generateEnhancedChunk(
  chunkTopic: string, 
  language: string, 
  difficulty_level: string, 
  target_length: number, 
  grammar_focus?: string,
  isFirstChunk: boolean = false,
  isLastChunk: boolean = false,
  previousChunk: any = null,
  outline: any = null
) {
  const contextInfo = previousChunk ? 
    `Continue from: "${previousChunk.sentences[previousChunk.sentences.length - 1]?.text || ''}"` :
    '';
    
  const themeInfo = outline?.theme ? `Story theme: ${outline.theme}` : '';
  const charactersInfo = outline?.characters ? `Characters: ${outline.characters.join(', ')}` : '';
  
  const prompt = `${isFirstChunk ? 'Begin' : 'Continue'} a ${language} story for ${difficulty_level} learners.

STORY CONTEXT:
${themeInfo}
${charactersInfo}
Section focus: ${chunkTopic}
${contextInfo}

REQUIREMENTS:
- Write EXACTLY ${target_length} words
- Create 4-8 natural, flowing sentences
- Use ${difficulty_level}-appropriate vocabulary
- ${isFirstChunk ? 'Establish setting and characters' : 'Maintain story continuity'}
- ${isLastChunk ? 'Provide satisfying conclusion' : 'Set up next section naturally'}
${grammar_focus ? `- Include grammar elements: ${grammar_focus}` : ''}

Return ONLY this JSON:
{
  "sentences": [
    {
      "id": "sentence-1",
      "text": "sentence in ${language}",
      "analysis": {
        "words": [
          {
            "word": "word",
            "definition": "clear definition",
            "partOfSpeech": "noun/verb/adjective/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["grammar concepts in this sentence"],
        "translation": "English translation"
      }
    }
  ],
  "analysis": {
    "wordCount": ${target_length},
    "readingTime": ${Math.ceil(target_length / 200)},
    "grammarPoints": ["main grammar concepts covered"]
  }
}`;

  // Enhanced token calculation for larger chunks
  const maxTokens = calculateEnhancedTokenLimit(target_length);
  console.log(`Enhanced chunk generation with ${maxTokens} tokens for ${target_length} words`);
  
  return await callOpenAIWithEnhancedParsing(prompt, maxTokens);
}

function calculateEnhancedTokenLimit(target_length: number): number {
  // More generous token allocation to prevent truncation
  const baseTokens = 2000;
  const contentTokens = Math.ceil(target_length * 1.8); // Increased multiplier
  const analysisTokens = Math.ceil(target_length * 0.6); // More analysis tokens
  return Math.min(12000, baseTokens + contentTokens + analysisTokens); // Increased max limit
}

function combineChunksWithValidation(chunks: any[], target_length: number) {
  console.log(`Combining ${chunks.length} chunks with validation`);
  
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
  
  // Validation logging
  console.log(`Final content: ${totalWordCount} words (target: ${target_length})`);
  console.log(`Sentences generated: ${allSentences.length}`);
  
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
  const prompt = `Analyze this custom text for ${difficulty_level} level ${language} learners.

Text: "${customText}"
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

Requirements:
1. Break into 5-12 natural sentences
2. Provide comprehensive word analysis
3. Preserve original meaning and style
4. Fix obvious errors while maintaining voice

Return ONLY this JSON:
{
  "sentences": [
    {
      "id": "sentence-1",
      "text": "sentence in ${language}",
      "analysis": {
        "words": [
          {
            "word": "word",
            "definition": "clear definition",
            "partOfSpeech": "noun/verb/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["grammar points"],
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

  return await callOpenAIWithEnhancedParsing(prompt, 4000);
}

async function generateAIContentWithRetry(topic: string, language: string, difficulty_level: string, target_length: number, grammar_focus?: string) {
  const maxRetries = 2;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`Content generation attempt ${attempt + 1}/${maxRetries} for ${target_length} words`);
      
      const content = await generateAIContent(topic, language, difficulty_level, target_length, grammar_focus);
      
      const actualWordCount = content.analysis?.wordCount || 0;
      const minExpectedWords = Math.floor(target_length * 0.7);
      
      console.log(`Generated ${actualWordCount} words, target: ${target_length}, minimum: ${minExpectedWords}`);
      
      if (actualWordCount >= minExpectedWords) {
        return content;
      } else {
        console.log(`Word count insufficient, retrying...`);
        attempt++;
        
        if (attempt === maxRetries) {
          console.warn('Max retries reached, returning available content');
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
  const prompt = `Create an engaging ${language} reading exercise for ${difficulty_level} learners.

Topic: ${topic}
TARGET: EXACTLY ${target_length} words
${grammar_focus ? `Grammar focus: ${grammar_focus}` : ''}

Requirements:
1. Write EXACTLY ${target_length} words total
2. Create 8-15 natural sentences
3. Include varied sentence structures
4. Use ${difficulty_level}-appropriate vocabulary
5. Provide comprehensive analysis
6. Include cultural authenticity

Return ONLY this JSON:
{
  "sentences": [
    {
      "id": "sentence-1",
      "text": "sentence in ${language}",
      "analysis": {
        "words": [
          {
            "word": "word",
            "definition": "clear definition",
            "partOfSpeech": "noun/verb/etc",
            "difficulty": "easy/medium/hard"
          }
        ],
        "grammar": ["grammar points"],
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

  const maxTokens = calculateEnhancedTokenLimit(target_length);
  console.log(`Standard generation with enhanced tokens: ${maxTokens} for ${target_length} words`);
  
  return await callOpenAIWithEnhancedParsing(prompt, maxTokens);
}

async function callOpenAIWithEnhancedParsing(prompt: string, maxTokens: number) {
  console.log(`Enhanced OpenAI call with max_tokens: ${maxTokens}`);
  
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
          content: `You are an expert language teacher creating high-quality reading exercises. You create authentic, culturally relevant content perfectly calibrated for language learners. 

CRITICAL REQUIREMENTS:
- Respond with ONLY valid JSON, no additional text
- Ensure every word in vocabulary analysis appears in the text
- Generate content that meets the EXACT word count specified
- Never truncate JSON output - complete all structures fully
- If approaching token limits, prioritize completing the JSON structure over additional words`
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

  console.log(`Raw OpenAI response length: ${content.length}`);

  // Enhanced JSON parsing with multiple fallback strategies
  let parsedContent;
  try {
    parsedContent = JSON.parse(content);
  } catch (parseError) {
    console.error('Initial JSON parse failed:', parseError.message);
    console.log('Raw content sample:', content.substring(0, 500) + '...');
    
    // Strategy 1: Try to fix common JSON issues
    let cleanedContent = content.trim();
    
    // Remove any text before first {
    const firstBrace = cleanedContent.indexOf('{');
    if (firstBrace > 0) {
      cleanedContent = cleanedContent.substring(firstBrace);
    }
    
    // Find last complete } and truncate there
    let lastValidBrace = -1;
    let braceCount = 0;
    for (let i = 0; i < cleanedContent.length; i++) {
      if (cleanedContent[i] === '{') braceCount++;
      if (cleanedContent[i] === '}') {
        braceCount--;
        if (braceCount === 0) lastValidBrace = i;
      }
    }
    
    if (lastValidBrace > 0) {
      cleanedContent = cleanedContent.substring(0, lastValidBrace + 1);
    }
    
    try {
      parsedContent = JSON.parse(cleanedContent);
      console.log('JSON recovered using cleanup strategy');
    } catch (secondParseError) {
      console.error('Cleanup strategy failed:', secondParseError.message);
      
      // Strategy 2: Try regex extraction
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedContent = JSON.parse(jsonMatch[0]);
          console.log('JSON recovered using regex extraction');
        } catch (regexParseError) {
          console.error('Regex extraction failed:', regexParseError.message);
          throw new Error('Failed to parse OpenAI response as valid JSON');
        }
      } else {
        throw new Error('No valid JSON structure found in OpenAI response');
      }
    }
  }

  // Enhanced validation and completion
  if (!parsedContent || typeof parsedContent !== 'object') {
    throw new Error('Invalid response structure: not an object');
  }

  if (!parsedContent.sentences || !Array.isArray(parsedContent.sentences)) {
    throw new Error('Invalid response structure: missing sentences array');
  }

  // Enhanced content processing
  parsedContent.sentences = parsedContent.sentences.map((sentence: any, index: number) => ({
    ...sentence,
    id: sentence.id || `sentence-${index + 1}`,
    analysis: {
      words: sentence.analysis?.words || [],
      grammar: sentence.analysis?.grammar || [],
      translation: sentence.analysis?.translation || ''
    }
  }));

  // Calculate and update word count
  const actualWordCount = parsedContent.sentences.reduce((count: number, sentence: any) => {
    return count + (sentence.text?.split(' ').length || 0);
  }, 0);

  if (!parsedContent.analysis) {
    parsedContent.analysis = {};
  }
  
  parsedContent.analysis.wordCount = actualWordCount;
  parsedContent.analysis.readingTime = Math.ceil(actualWordCount / 200);
  parsedContent.analysis.grammarPoints = parsedContent.analysis.grammarPoints || [];

  console.log(`Enhanced processing completed: ${actualWordCount} words`);
  return parsedContent;
}

