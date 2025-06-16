
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced configuration
const CONFIG = {
  OPENAI_TIMEOUT: 120000, // 2 minutes for complex generations
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  CHUNK_SIZE: 800,
  MIN_QUALITY_SCORE: 0.6,
} as const;

interface GenerationRequest {
  topic?: string;
  language: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  target_length: number;
  grammar_focus?: string;
  customText?: string;
  isCustomText?: boolean;
  directGeneration?: boolean;
  enhancedMode?: boolean;
  chunkingStrategy?: 'smart' | 'adaptive';
  recoveryMode?: boolean;
  intelligentFallback?: boolean;
}

interface GenerationResult {
  sentences: Array<{
    id: string;
    text: string;
    translation?: string;
    difficulty?: number;
  }>;
  analysis: {
    wordCount: number;
    readingTime: number;
    grammarPoints: string[];
    enhancedGeneration?: boolean;
    qualityMetrics?: {
      vocabularyDiversity?: number;
      coherenceScore?: number;
      generationStrategy?: string;
      recoveryUsed?: boolean;
    };
    fallbackInfo?: {
      isUsable: boolean;
      reason?: string;
    };
    recoveryInfo?: {
      used: boolean;
      strategy?: string;
    };
  };
}

class ContentGenerationService {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  async generateContent(request: GenerationRequest): Promise<GenerationResult> {
    console.log('[CONTENT GENERATION] Starting generation with request:', {
      topic: request.topic,
      language: request.language,
      difficulty: request.difficulty_level,
      targetLength: request.target_length,
      isCustomText: request.isCustomText,
      enhancedMode: request.enhancedMode
    });

    // Handle custom text processing
    if (request.isCustomText && request.customText) {
      return this.processCustomText(request.customText, request.language, request.difficulty_level);
    }

    // Generate AI content with enhanced strategies
    if (request.enhancedMode) {
      return this.generateEnhancedContent(request);
    }

    // Fallback to standard generation
    return this.generateStandardContent(request);
  }

  private async processCustomText(customText: string, language: string, difficultyLevel: string): Promise<GenerationResult> {
    console.log('[CUSTOM TEXT] Processing custom text, length:', customText.length);

    const sentences = this.splitIntoSentences(customText);
    const wordCount = customText.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Assuming 200 WPM reading speed

    return {
      sentences: sentences.map((text, index) => ({
        id: `custom-${index + 1}`,
        text: text.trim(),
        difficulty: this.estimateSentenceDifficulty(text, difficultyLevel)
      })),
      analysis: {
        wordCount,
        readingTime,
        grammarPoints: this.extractGrammarPoints(customText, language),
        enhancedGeneration: false,
        qualityMetrics: {
          vocabularyDiversity: this.calculateVocabularyDiversity(customText),
          coherenceScore: 0.8, // Assume good coherence for custom text
          generationStrategy: 'custom_text_processing'
        }
      }
    };
  }

  private async generateEnhancedContent(request: GenerationRequest): Promise<GenerationResult> {
    const strategy = this.determineStrategy(request.target_length);
    console.log('[ENHANCED GENERATION] Using strategy:', strategy);

    try {
      let result: GenerationResult;

      if (strategy === 'direct') {
        result = await this.generateDirect(request);
      } else if (strategy === 'smart_chunking') {
        result = await this.generateWithSmartChunking(request);
      } else {
        result = await this.generateWithAdaptiveChunking(request);
      }

      // Enhance the result with quality metrics
      result.analysis.enhancedGeneration = true;
      result.analysis.qualityMetrics = {
        ...result.analysis.qualityMetrics,
        generationStrategy: strategy
      };

      return result;
    } catch (error) {
      console.error('[ENHANCED GENERATION] Failed, attempting recovery:', error.message);
      
      if (request.recoveryMode) {
        throw error; // Prevent infinite recursion
      }

      return this.attemptIntelligentRecovery(request, error);
    }
  }

  private async generateStandardContent(request: GenerationRequest): Promise<GenerationResult> {
    console.log('[STANDARD GENERATION] Generating standard content');
    
    const prompt = this.buildPrompt(request);
    const response = await this.callOpenAI(prompt, request.language);
    
    return this.parseResponse(response, request);
  }

  private determineStrategy(targetLength: number): string {
    if (targetLength <= 800) return 'direct';
    if (targetLength <= 1500) return 'smart_chunking';
    return 'adaptive_chunking';
  }

  private async generateDirect(request: GenerationRequest): Promise<GenerationResult> {
    console.log('[DIRECT GENERATION] Generating content directly');
    
    const prompt = this.buildEnhancedPrompt(request);
    const response = await this.callOpenAI(prompt, request.language);
    
    return this.parseEnhancedResponse(response, request);
  }

  private async generateWithSmartChunking(request: GenerationRequest): Promise<GenerationResult> {
    console.log('[SMART CHUNKING] Generating with smart chunking strategy');
    
    const chunkCount = Math.ceil(request.target_length / CONFIG.CHUNK_SIZE);
    const chunks: string[] = [];
    
    for (let i = 0; i < chunkCount; i++) {
      const chunkPrompt = this.buildChunkPrompt(request, i, chunkCount);
      const chunkResponse = await this.callOpenAI(chunkPrompt, request.language);
      chunks.push(chunkResponse);
      
      // Brief delay between chunks to avoid rate limiting
      if (i < chunkCount - 1) {
        await this.delay(1000);
      }
    }
    
    const combinedText = chunks.join(' ');
    return this.parseEnhancedResponse(combinedText, request);
  }

  private async generateWithAdaptiveChunking(request: GenerationRequest): Promise<GenerationResult> {
    console.log('[ADAPTIVE CHUNKING] Generating with adaptive chunking strategy');
    
    // Adaptive chunking with overlap for better coherence
    const targetChunkSize = Math.min(CONFIG.CHUNK_SIZE, request.target_length / 3);
    const overlapSize = Math.floor(targetChunkSize * 0.1);
    
    const chunks: string[] = [];
    let previousContext = '';
    
    const chunkCount = Math.ceil(request.target_length / targetChunkSize);
    
    for (let i = 0; i < chunkCount; i++) {
      const chunkPrompt = this.buildAdaptiveChunkPrompt(request, i, chunkCount, previousContext);
      const chunkResponse = await this.callOpenAI(chunkPrompt, request.language);
      
      chunks.push(chunkResponse);
      
      // Update context for next chunk (last few sentences)
      const sentences = this.splitIntoSentences(chunkResponse);
      previousContext = sentences.slice(-2).join(' ');
      
      // Brief delay between chunks
      if (i < chunkCount - 1) {
        await this.delay(1500);
      }
    }
    
    const combinedText = this.mergeChunksWithOverlapRemoval(chunks);
    return this.parseEnhancedResponse(combinedText, request);
  }

  private async attemptIntelligentRecovery(request: GenerationRequest, error: Error): Promise<GenerationResult> {
    console.log('[INTELLIGENT RECOVERY] Attempting recovery after error:', error.message);
    
    // Create a simplified recovery request
    const recoveryRequest: GenerationRequest = {
      ...request,
      target_length: Math.min(request.target_length, 600), // Reduce complexity
      recoveryMode: true,
      intelligentFallback: true,
      enhancedMode: false // Use standard generation for recovery
    };
    
    try {
      const result = await this.generateStandardContent(recoveryRequest);
      
      // Mark as recovery result
      result.analysis.recoveryInfo = {
        used: true,
        strategy: 'intelligent_fallback'
      };
      
      result.analysis.fallbackInfo = {
        isUsable: true,
        reason: `Recovered from: ${error.message}`
      };
      
      console.log('[INTELLIGENT RECOVERY] Successfully recovered with fallback');
      return result;
    } catch (recoveryError) {
      console.error('[INTELLIGENT RECOVERY] Recovery also failed:', recoveryError.message);
      throw new Error(`Generation failed and recovery unsuccessful: ${error.message}`);
    }
  }

  private async callOpenAI(prompt: string, language: string): Promise<string> {
    console.log('[OPENAI CALL] Making request to OpenAI, prompt length:', prompt.length);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.OPENAI_TIMEOUT);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert language teacher creating reading content in ${language}. Focus on natural, engaging content that flows well and is appropriate for language learners.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response structure from OpenAI');
      }

      const content = data.choices[0].message.content.trim();
      console.log('[OPENAI CALL] Received response, length:', content.length);
      
      return content;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`OpenAI request timeout after ${CONFIG.OPENAI_TIMEOUT / 1000} seconds`);
      }
      
      throw error;
    }
  }

  private buildPrompt(request: GenerationRequest): string {
    const { topic, language, difficulty_level, target_length, grammar_focus } = request;
    
    return `Create a ${target_length}-word reading passage in ${language} about "${topic || 'general topics'}" at ${difficulty_level} level.
    ${grammar_focus ? `Focus on these grammar points: ${grammar_focus}.` : ''}
    
    Requirements:
    - Natural, engaging content
    - Appropriate vocabulary for ${difficulty_level} learners
    - Clear, well-structured sentences
    - Coherent narrative or informational flow
    
    Return only the text content, no additional formatting or explanations.`;
  }

  private buildEnhancedPrompt(request: GenerationRequest): string {
    const { topic, language, difficulty_level, target_length, grammar_focus } = request;
    
    return `Create an enhanced ${target_length}-word reading passage in ${language} about "${topic || 'interesting topics'}" at ${difficulty_level} level.
    ${grammar_focus ? `Incorporate these grammar structures naturally: ${grammar_focus}.` : ''}
    
    Enhanced Requirements:
    - Rich vocabulary appropriate for ${difficulty_level} level
    - Varied sentence structures for engagement
    - Natural transitions between ideas
    - Cultural context when relevant
    - Educational value beyond language learning
    
    Focus on creating content that language learners will find both challenging and enjoyable.
    Return only the text content.`;
  }

  private buildChunkPrompt(request: GenerationRequest, chunkIndex: number, totalChunks: number): string {
    const { topic, language, difficulty_level, grammar_focus } = request;
    const chunkLength = Math.ceil(request.target_length / totalChunks);
    
    return `Create part ${chunkIndex + 1} of ${totalChunks} of a reading passage in ${language} about "${topic || 'interesting topics'}" at ${difficulty_level} level.
    This section should be approximately ${chunkLength} words.
    ${grammar_focus ? `Focus on: ${grammar_focus}.` : ''}
    
    ${chunkIndex === 0 ? 'This is the opening section - establish the topic and context.' : ''}
    ${chunkIndex === totalChunks - 1 ? 'This is the concluding section - provide closure.' : ''}
    ${chunkIndex > 0 && chunkIndex < totalChunks - 1 ? 'This is a middle section - develop the topic further.' : ''}
    
    Return only the text content for this section.`;
  }

  private buildAdaptiveChunkPrompt(request: GenerationRequest, chunkIndex: number, totalChunks: number, previousContext: string): string {
    const { topic, language, difficulty_level } = request;
    const chunkLength = Math.ceil(request.target_length / totalChunks);
    
    let prompt = `Continue a reading passage in ${language} about "${topic || 'interesting topics'}" at ${difficulty_level} level.
    Write approximately ${chunkLength} words for this section.`;
    
    if (previousContext) {
      prompt += `\n\nPrevious context: "${previousContext}"\n\nContinue naturally from this context.`;
    }
    
    prompt += '\n\nReturn only the text content for this section.';
    
    return prompt;
  }

  private parseResponse(response: string, request: GenerationRequest): GenerationResult {
    const sentences = this.splitIntoSentences(response);
    const wordCount = response.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    return {
      sentences: sentences.map((text, index) => ({
        id: `sentence-${index + 1}`,
        text: text.trim(),
        difficulty: this.estimateSentenceDifficulty(text, request.difficulty_level)
      })),
      analysis: {
        wordCount,
        readingTime,
        grammarPoints: this.extractGrammarPoints(response, request.language)
      }
    };
  }

  private parseEnhancedResponse(response: string, request: GenerationRequest): GenerationResult {
    const result = this.parseResponse(response, request);
    
    // Add enhanced analysis
    result.analysis.qualityMetrics = {
      vocabularyDiversity: this.calculateVocabularyDiversity(response),
      coherenceScore: this.calculateCoherenceScore(response),
    };
    
    return result;
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s + (s.match(/[.!?]$/) ? '' : '.'));
  }

  private estimateSentenceDifficulty(sentence: string, level: string): number {
    const wordCount = sentence.split(/\s+/).length;
    const avgWordLength = sentence.replace(/\s+/g, '').length / wordCount;
    
    let baseDifficulty = 0.5;
    if (level === 'beginner') baseDifficulty = 0.3;
    if (level === 'advanced') baseDifficulty = 0.7;
    
    // Adjust based on sentence complexity
    const complexityFactor = Math.min(1, (wordCount * avgWordLength) / 50);
    
    return Math.min(1, baseDifficulty + complexityFactor * 0.3);
  }

  private extractGrammarPoints(text: string, language: string): string[] {
    // Simple grammar point extraction - could be enhanced with more sophisticated analysis
    const grammarPoints: string[] = [];
    
    if (text.includes(',')) grammarPoints.push('Complex sentences');
    if (text.match(/\b(and|but|or|because|although|while)\b/i)) grammarPoints.push('Conjunctions');
    if (text.match(/\b(the|a|an)\b/g)?.length > 3) grammarPoints.push('Articles');
    if (text.match(/\b\w+ly\b/g)) grammarPoints.push('Adverbs');
    if (text.match(/\b(will|would|should|could|might|may)\b/i)) grammarPoints.push('Modal verbs');
    
    return grammarPoints.slice(0, 5); // Limit to 5 points
  }

  private calculateVocabularyDiversity(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    return Math.min(1, uniqueWords.size / words.length);
  }

  private calculateCoherenceScore(text: string): number {
    // Simple coherence scoring based on sentence structure and transitions
    const sentences = this.splitIntoSentences(text);
    let coherenceScore = 0.7; // Base score
    
    // Check for transition words
    const transitions = text.match(/\b(however|therefore|moreover|furthermore|consequently|meanwhile|additionally)\b/gi);
    if (transitions) {
      coherenceScore += Math.min(0.2, transitions.length * 0.05);
    }
    
    // Check for consistent sentence length variation
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    
    if (variance > 10 && variance < 50) { // Good variation
      coherenceScore += 0.1;
    }
    
    return Math.min(1, coherenceScore);
  }

  private mergeChunksWithOverlapRemoval(chunks: string[]): string {
    if (chunks.length <= 1) return chunks.join('');
    
    let merged = chunks[0];
    
    for (let i = 1; i < chunks.length; i++) {
      const currentChunk = chunks[i];
      const lastSentences = this.splitIntoSentences(merged).slice(-2);
      const currentSentences = this.splitIntoSentences(currentChunk);
      
      // Remove potential overlap
      let startIndex = 0;
      for (let j = 0; j < Math.min(lastSentences.length, currentSentences.length); j++) {
        if (lastSentences[lastSentences.length - 1 - j]?.toLowerCase().trim() === 
            currentSentences[j]?.toLowerCase().trim()) {
          startIndex = j + 1;
        }
      }
      
      const newContent = currentSentences.slice(startIndex).join(' ');
      merged += ' ' + newContent;
    }
    
    return merged.trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[FUNCTION START] Processing reading content generation request');
    
    const requestData: GenerationRequest = await req.json();
    
    // Validate required fields
    if (!requestData.language) {
      throw new Error('Language is required');
    }
    
    if (!requestData.isCustomText && !requestData.topic) {
      throw new Error('Topic is required for AI-generated content');
    }
    
    console.log('[VALIDATION] Request validated successfully');
    
    // Initialize service and generate content
    const service = new ContentGenerationService();
    const result = await service.generateContent(requestData);
    
    console.log('[SUCCESS] Content generated successfully', {
      wordCount: result.analysis.wordCount,
      sentenceCount: result.sentences.length,
      enhanced: result.analysis.enhancedGeneration,
      recovery: result.analysis.recoveryInfo?.used
    });
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[ERROR] Content generation failed:', error);
    
    // Determine error type and provide appropriate response
    let status = 500;
    let errorMessage = 'An unexpected error occurred during content generation';
    
    if (error.message.includes('timeout')) {
      status = 408;
      errorMessage = 'Content generation timed out. Please try with shorter content or try again.';
    } else if (error.message.includes('OpenAI API')) {
      status = 502;
      errorMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
    } else if (error.message.includes('required')) {
      status = 400;
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
