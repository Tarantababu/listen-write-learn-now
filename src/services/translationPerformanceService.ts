
import { supabase } from '@/integrations/supabase/client';

interface ChunkAnalysisResult {
  chunkIndex: number;
  normalTranslation: string;
  literalTranslation: string;
  wordTranslations: Array<{
    original: string;
    translation: string;
  }>;
  processingTime: number;
  retryCount?: number;
  errorRecovered?: boolean;
}

interface OptimizedTranslationResult {
  normalTranslation: string;
  literalTranslation: string;
  wordTranslations: Array<{
    original: string;
    translation: string;
  }>;
  performanceMetrics: {
    totalProcessingTime: number;
    chunkCount: number;
    averageChunkTime: number;
    parallelProcessing: boolean;
    cacheHits: number;
    failureRate: number;
    retryCount: number;
    errorRecoveryUsed: boolean;
  };
}

interface TranslationCache {
  [key: string]: ChunkAnalysisResult;
}

interface RateLimitState {
  requestCount: number;
  windowStart: number;
  blocked: boolean;
}

export class TranslationPerformanceService {
  private cache: TranslationCache = {};
  private readonly OPTIMAL_CHUNK_SIZE = 300; // words
  private readonly MAX_CHUNK_SIZE = 500; // words
  private readonly MIN_CHUNK_SIZE = 50; // words
  
  // Rate limiting configuration
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 20;
  private rateLimitState: RateLimitState = {
    requestCount: 0,
    windowStart: Date.now(),
    blocked: false
  };
  
  // Error tracking
  private errorCount = 0;
  private successCount = 0;
  
  async optimizedTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<OptimizedTranslationResult> {
    const startTime = Date.now();
    console.log('[TRANSLATION PERFORMANCE] Starting optimized translation with enhanced error handling');
    
    // Check rate limits
    if (this.isRateLimited()) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }
    
    onProgress?.(10, 'Analyzing text structure...');
    
    try {
      // Phase 1: Smart Text Chunking
      const chunks = this.smartTextChunking(text);
      console.log(`[TRANSLATION PERFORMANCE] Created ${chunks.length} chunks`);
      
      onProgress?.(25, `Processing ${chunks.length} text segments...`);
      
      // Phase 2: Enhanced Parallel Processing with Error Recovery
      const useParallel = chunks.length > 1 && chunks.length <= 6; // Reduced for stability
      const chunkResults = useParallel 
        ? await this.processChunksInParallelWithErrorRecovery(chunks, sourceLanguage, targetLanguage, onProgress)
        : await this.processChunksSequentiallyWithErrorRecovery(chunks, sourceLanguage, targetLanguage, onProgress);
      
      onProgress?.(85, 'Combining results...');
      
      // Phase 3: Intelligent Result Combination
      const combinedResult = this.combineChunkResults(chunkResults);
      
      const totalProcessingTime = Date.now() - startTime;
      const cacheHits = chunkResults.filter(r => r.processingTime === 0).length;
      const failures = chunkResults.filter(r => r.errorRecovered).length;
      const totalRetries = chunkResults.reduce((sum, r) => sum + (r.retryCount || 0), 0);
      
      // Update success metrics
      this.successCount++;
      
      onProgress?.(100, 'Translation completed!');
      
      console.log(`[TRANSLATION PERFORMANCE] Completed in ${totalProcessingTime}ms with ${cacheHits} cache hits, ${failures} recoveries, ${totalRetries} retries`);
      
      return {
        ...combinedResult,
        performanceMetrics: {
          totalProcessingTime,
          chunkCount: chunks.length,
          averageChunkTime: chunkResults.reduce((sum, r) => sum + r.processingTime, 0) / chunkResults.length,
          parallelProcessing: useParallel,
          cacheHits,
          failureRate: failures / chunks.length,
          retryCount: totalRetries,
          errorRecoveryUsed: failures > 0
        }
      };
    } catch (error) {
      this.errorCount++;
      console.error('[TRANSLATION PERFORMANCE] Critical error:', error);
      
      // Provide fallback response for critical failures
      const fallbackResult = this.createFallbackResult(text, sourceLanguage, targetLanguage);
      const totalProcessingTime = Date.now() - startTime;
      
      onProgress?.(100, 'Translation completed with fallback content');
      
      return {
        ...fallbackResult,
        performanceMetrics: {
          totalProcessingTime,
          chunkCount: 1,
          averageChunkTime: totalProcessingTime,
          parallelProcessing: false,
          cacheHits: 0,
          failureRate: 1,
          retryCount: 0,
          errorRecoveryUsed: true
        }
      };
    }
  }

  private isRateLimited(): boolean {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.rateLimitState.windowStart > this.RATE_LIMIT_WINDOW) {
      this.rateLimitState = {
        requestCount: 0,
        windowStart: now,
        blocked: false
      };
    }
    
    // Check if blocked
    if (this.rateLimitState.blocked) {
      return true;
    }
    
    // Increment request count
    this.rateLimitState.requestCount++;
    
    // Check if we've exceeded the limit
    if (this.rateLimitState.requestCount > this.MAX_REQUESTS_PER_WINDOW) {
      this.rateLimitState.blocked = true;
      console.warn(`[TRANSLATION PERFORMANCE] Rate limit exceeded: ${this.rateLimitState.requestCount}/${this.MAX_REQUESTS_PER_WINDOW}`);
      return true;
    }
    
    return false;
  }

  private smartTextChunking(text: string): string[] {
    const words = text.split(/\s+/);
    
    // If text is small enough, don't chunk
    if (words.length <= this.OPTIMAL_CHUNK_SIZE) {
      return [text];
    }
    
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      currentChunk.push(words[i]);
      
      // Check if we should end this chunk
      const shouldEndChunk = 
        currentChunk.length >= this.OPTIMAL_CHUNK_SIZE && (
          // End at sentence boundaries
          words[i].match(/[.!?]$/) ||
          // Or at natural breaks
          (currentChunk.length >= this.OPTIMAL_CHUNK_SIZE && words[i].match(/[,;:]$/)) ||
          // Force end if too large
          currentChunk.length >= this.MAX_CHUNK_SIZE
        );
      
      if (shouldEndChunk || i === words.length - 1) {
        if (currentChunk.length >= this.MIN_CHUNK_SIZE || chunks.length === 0) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [];
        } else {
          // Merge small chunk with previous one
          if (chunks.length > 0) {
            chunks[chunks.length - 1] += ' ' + currentChunk.join(' ');
          } else {
            chunks.push(currentChunk.join(' '));
          }
          currentChunk = [];
        }
      }
    }
    
    return chunks;
  }

  private async processChunksInParallelWithErrorRecovery(
    chunks: string[],
    sourceLanguage: string,
    targetLanguage: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<ChunkAnalysisResult[]> {
    console.log('[TRANSLATION PERFORMANCE] Using parallel processing with error recovery');
    
    const promises = chunks.map((chunk, index) => 
      this.processChunkWithRetryAndRecovery(chunk, index, sourceLanguage, targetLanguage)
    );
    
    // Process with progress updates and error handling
    const results: ChunkAnalysisResult[] = [];
    for (let i = 0; i < promises.length; i++) {
      try {
        const result = await promises[i];
        results.push(result);
      } catch (error) {
        console.error(`[TRANSLATION PERFORMANCE] Parallel chunk ${i} failed with unrecoverable error:`, error);
        // Create emergency fallback for this chunk
        results.push(this.createEmergencyChunkResult(chunks[i], i, sourceLanguage, targetLanguage));
      }
      
      const progress = 25 + Math.round((i + 1) / promises.length * 60);
      onProgress?.(progress, `Processed segment ${i + 1}/${chunks.length}`);
    }
    
    return results;
  }

  private async processChunksSequentiallyWithErrorRecovery(
    chunks: string[],
    sourceLanguage: string,
    targetLanguage: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<ChunkAnalysisResult[]> {
    console.log('[TRANSLATION PERFORMANCE] Using sequential processing with error recovery');
    
    const results: ChunkAnalysisResult[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const result = await this.processChunkWithRetryAndRecovery(chunks[i], i, sourceLanguage, targetLanguage);
        results.push(result);
      } catch (error) {
        console.error(`[TRANSLATION PERFORMANCE] Sequential chunk ${i} failed with unrecoverable error:`, error);
        // Create emergency fallback for this chunk
        results.push(this.createEmergencyChunkResult(chunks[i], i, sourceLanguage, targetLanguage));
      }
      
      const progress = 25 + Math.round((i + 1) / chunks.length * 60);
      onProgress?.(progress, `Processed segment ${i + 1}/${chunks.length}`);
    }
    
    return results;
  }

  private async processChunkWithRetryAndRecovery(
    chunk: string,
    index: number,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<ChunkAnalysisResult> {
    const cacheKey = this.generateCacheKey(chunk, sourceLanguage, targetLanguage);
    
    // Check cache first
    if (this.cache[cacheKey]) {
      console.log(`[TRANSLATION PERFORMANCE] Cache hit for chunk ${index}`);
      return {
        ...this.cache[cacheKey],
        chunkIndex: index,
        processingTime: 0 // Indicate cache hit
      };
    }
    
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        
        const { data, error } = await supabase.functions.invoke('generate-reading-analysis', {
          body: {
            text: chunk,
            language: sourceLanguage,
            type: 'optimized_bidirectional_translation',
            supportLanguage: targetLanguage,
            chunkIndex: index
          }
        });

        if (error) {
          throw new Error(error.message || 'Translation failed');
        }

        const processingTime = Date.now() - startTime;
        const result: ChunkAnalysisResult = {
          chunkIndex: index,
          normalTranslation: data.normalTranslation || '',
          literalTranslation: data.literalTranslation || '',
          wordTranslations: data.wordTranslations || [],
          processingTime,
          retryCount: attempt - 1
        };

        // Cache the successful result
        this.cache[cacheKey] = result;
        
        console.log(`[TRANSLATION PERFORMANCE] Chunk ${index} processed in ${processingTime}ms (attempt ${attempt})`);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        retryCount = attempt - 1;
        console.error(`[TRANSLATION PERFORMANCE] Chunk ${index} attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`[TRANSLATION PERFORMANCE] Retrying chunk ${index} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed, create recovery result
    console.error(`[TRANSLATION PERFORMANCE] All retries failed for chunk ${index}, using error recovery`);
    return this.createErrorRecoveryResult(chunk, index, sourceLanguage, targetLanguage, retryCount, lastError);
  }

  private createErrorRecoveryResult(
    chunk: string,
    index: number,
    sourceLanguage: string,
    targetLanguage: string,
    retryCount: number,
    error: Error | null
  ): ChunkAnalysisResult {
    return {
      chunkIndex: index,
      normalTranslation: `[Recovery Mode] This ${sourceLanguage} text segment could not be translated due to technical issues. Content: "${chunk.substring(0, 100)}${chunk.length > 100 ? '...' : ''}"`,
      literalTranslation: `[Recovery Mode] Literal translation unavailable for this segment.`,
      wordTranslations: [],
      processingTime: 0,
      retryCount,
      errorRecovered: true
    };
  }

  private createEmergencyChunkResult(
    chunk: string,
    index: number,
    sourceLanguage: string,
    targetLanguage: string
  ): ChunkAnalysisResult {
    return {
      chunkIndex: index,
      normalTranslation: `[Emergency Mode] Translation service temporarily unavailable for this ${sourceLanguage} segment.`,
      literalTranslation: `[Emergency Mode] Literal translation unavailable.`,
      wordTranslations: [],
      processingTime: 0,
      retryCount: 0,
      errorRecovered: true
    };
  }

  private createFallbackResult(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Omit<OptimizedTranslationResult, 'performanceMetrics'> {
    return {
      normalTranslation: `[System Fallback] The translation service is currently experiencing issues. The original ${sourceLanguage} text has been preserved: "${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"`,
      literalTranslation: `[System Fallback] Literal translation service unavailable.`,
      wordTranslations: []
    };
  }

  private combineChunkResults(results: ChunkAnalysisResult[]): Omit<OptimizedTranslationResult, 'performanceMetrics'> {
    // Sort by chunk index to ensure correct order
    const sortedResults = results.sort((a, b) => a.chunkIndex - b.chunkIndex);
    
    const normalTranslation = sortedResults
      .map(r => r.normalTranslation)
      .filter(Boolean)
      .join(' ');
    
    const literalTranslation = sortedResults
      .map(r => r.literalTranslation)
      .filter(Boolean)
      .join(' ');
    
    // Combine word translations, removing duplicates
    const allWordTranslations = sortedResults
      .flatMap(r => r.wordTranslations)
      .filter(Boolean);
    
    const uniqueWordTranslations = Array.from(
      new Map(allWordTranslations.map(wt => [wt.original.toLowerCase(), wt])).values()
    );
    
    return {
      normalTranslation,
      literalTranslation,
      wordTranslations: uniqueWordTranslations
    };
  }

  private generateCacheKey(text: string, sourceLanguage: string, targetLanguage: string): string {
    // Create a simple hash for the cache key
    const content = `${text}-${sourceLanguage}-${targetLanguage}`;
    return btoa(content).substring(0, 32);
  }

  // Enhanced cache management methods
  clearCache(): void {
    this.cache = {};
    console.log('[TRANSLATION PERFORMANCE] Cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: Object.keys(this.cache).length,
      keys: Object.keys(this.cache)
    };
  }

  getPerformanceStats(): { successRate: number; errorCount: number; successCount: number } {
    const total = this.successCount + this.errorCount;
    return {
      successRate: total > 0 ? this.successCount / total : 0,
      errorCount: this.errorCount,
      successCount: this.successCount
    };
  }

  resetPerformanceStats(): void {
    this.errorCount = 0;
    this.successCount = 0;
    console.log('[TRANSLATION PERFORMANCE] Performance stats reset');
  }
}

export const translationPerformanceService = new TranslationPerformanceService();
