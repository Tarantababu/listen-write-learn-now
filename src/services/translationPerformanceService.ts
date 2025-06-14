
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
  };
}

interface TranslationCache {
  [key: string]: ChunkAnalysisResult;
}

export class TranslationPerformanceService {
  private cache: TranslationCache = new Map();
  private readonly OPTIMAL_CHUNK_SIZE = 300; // words
  private readonly MAX_CHUNK_SIZE = 500; // words
  private readonly MIN_CHUNK_SIZE = 50; // words
  
  async optimizedTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<OptimizedTranslationResult> {
    const startTime = Date.now();
    console.log('[TRANSLATION PERFORMANCE] Starting optimized translation');
    
    onProgress?.(10, 'Analyzing text structure...');
    
    // Phase 1: Smart Text Chunking
    const chunks = this.smartTextChunking(text);
    console.log(`[TRANSLATION PERFORMANCE] Created ${chunks.length} chunks`);
    
    onProgress?.(25, `Processing ${chunks.length} text segments...`);
    
    // Phase 2: Parallel Processing with Rate Limiting
    const useParallel = chunks.length > 1 && chunks.length <= 8; // Reasonable parallel limit
    const chunkResults = useParallel 
      ? await this.processChunksInParallel(chunks, sourceLanguage, targetLanguage, onProgress)
      : await this.processChunksSequentially(chunks, sourceLanguage, targetLanguage, onProgress);
    
    onProgress?.(85, 'Combining results...');
    
    // Phase 3: Intelligent Result Combination
    const combinedResult = this.combineChunkResults(chunkResults);
    
    const totalProcessingTime = Date.now() - startTime;
    const cacheHits = chunkResults.filter(r => r.processingTime === 0).length;
    
    onProgress?.(100, 'Translation completed!');
    
    console.log(`[TRANSLATION PERFORMANCE] Completed in ${totalProcessingTime}ms with ${cacheHits} cache hits`);
    
    return {
      ...combinedResult,
      performanceMetrics: {
        totalProcessingTime,
        chunkCount: chunks.length,
        averageChunkTime: chunkResults.reduce((sum, r) => sum + r.processingTime, 0) / chunkResults.length,
        parallelProcessing: useParallel,
        cacheHits
      }
    };
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

  private async processChunksInParallel(
    chunks: string[],
    sourceLanguage: string,
    targetLanguage: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<ChunkAnalysisResult[]> {
    console.log('[TRANSLATION PERFORMANCE] Using parallel processing');
    
    const promises = chunks.map((chunk, index) => 
      this.processChunkWithCache(chunk, index, sourceLanguage, targetLanguage)
    );
    
    // Process with progress updates
    const results: ChunkAnalysisResult[] = [];
    for (let i = 0; i < promises.length; i++) {
      const result = await promises[i];
      results.push(result);
      
      const progress = 25 + Math.round((i + 1) / promises.length * 60);
      onProgress?.(progress, `Processed segment ${i + 1}/${chunks.length}`);
    }
    
    return results;
  }

  private async processChunksSequentially(
    chunks: string[],
    sourceLanguage: string,
    targetLanguage: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<ChunkAnalysisResult[]> {
    console.log('[TRANSLATION PERFORMANCE] Using sequential processing');
    
    const results: ChunkAnalysisResult[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const result = await this.processChunkWithCache(chunks[i], i, sourceLanguage, targetLanguage);
      results.push(result);
      
      const progress = 25 + Math.round((i + 1) / chunks.length * 60);
      onProgress?.(progress, `Processed segment ${i + 1}/${chunks.length}`);
    }
    
    return results;
  }

  private async processChunkWithCache(
    chunk: string,
    index: number,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<ChunkAnalysisResult> {
    const cacheKey = this.generateCacheKey(chunk, sourceLanguage, targetLanguage);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`[TRANSLATION PERFORMANCE] Cache hit for chunk ${index}`);
      return {
        ...this.cache.get(cacheKey)!,
        chunkIndex: index,
        processingTime: 0 // Indicate cache hit
      };
    }
    
    const startTime = Date.now();
    
    try {
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
        processingTime
      };

      // Cache the result
      this.cache.set(cacheKey, result);
      
      console.log(`[TRANSLATION PERFORMANCE] Chunk ${index} processed in ${processingTime}ms`);
      return result;
      
    } catch (error) {
      console.error(`[TRANSLATION PERFORMANCE] Error processing chunk ${index}:`, error);
      
      // Return fallback result
      return {
        chunkIndex: index,
        normalTranslation: `Translation unavailable for segment ${index + 1}`,
        literalTranslation: `Literal translation unavailable for segment ${index + 1}`,
        wordTranslations: [],
        processingTime: Date.now() - startTime
      };
    }
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

  // Cache management methods
  clearCache(): void {
    this.cache.clear();
    console.log('[TRANSLATION PERFORMANCE] Cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const translationPerformanceService = new TranslationPerformanceService();
