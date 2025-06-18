
import { useState, useEffect, useCallback, useRef } from 'react';
import { enhancedTtsService, TtsProgress, TtsGenerationOptions } from '@/services/enhancedTtsService';

export interface TtsQueueItem {
  id: string;
  text: string;
  language: string;
  chunkSize?: 'small' | 'medium' | 'large' | 'auto';
  priority?: number;
  sessionId?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';
  progress?: TtsProgress;
  result?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface UseTtsQueueOptions {
  maxConcurrent?: number;
  autoStart?: boolean;
  onItemComplete?: (item: TtsQueueItem) => void;
  onItemError?: (item: TtsQueueItem, error: string) => void;
  onQueueEmpty?: () => void;
}

export const useTtsQueue = (options: UseTtsQueueOptions = {}) => {
  const {
    maxConcurrent = 2,
    autoStart = true,
    onItemComplete,
    onItemError,
    onQueueEmpty
  } = options;

  const [queue, setQueue] = useState<TtsQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  
  const processingRef = useRef<Set<string>>(new Set());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Add item to queue
  const addToQueue = useCallback((
    text: string,
    language: string,
    options: {
      chunkSize?: 'small' | 'medium' | 'large' | 'auto';
      priority?: number;
      id?: string;
    } = {}
  ): string => {
    const id = options.id || `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newItem: TtsQueueItem = {
      id,
      text,
      language,
      chunkSize: options.chunkSize || 'auto',
      priority: options.priority || 0,
      status: 'pending',
      createdAt: Date.now()
    };

    setQueue(prev => {
      const updated = [...prev, newItem];
      // Sort by priority (higher first), then by creation time
      return updated.sort((a, b) => {
        if (b.priority !== a.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return a.createdAt - b.createdAt;
      });
    });

    return id;
  }, []);

  // Remove item from queue
  const removeFromQueue = useCallback((id: string) => {
    // Cancel if currently processing
    if (processingRef.current.has(id)) {
      const controller = abortControllersRef.current.get(id);
      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(id);
      }
      processingRef.current.delete(id);
    }

    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  // Update item status
  const updateItem = useCallback((id: string, updates: Partial<TtsQueueItem>) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Process single item
  const processItem = useCallback(async (item: TtsQueueItem) => {
    if (processingRef.current.has(item.id)) return;

    processingRef.current.add(item.id);
    setActiveCount(prev => prev + 1);

    // Create abort controller
    const controller = new AbortController();
    abortControllersRef.current.set(item.id, controller);

    // Update status to generating
    updateItem(item.id, { 
      status: 'generating',
      sessionId: `${item.id}_session`
    });

    try {
      const generationOptions: TtsGenerationOptions = {
        text: item.text,
        language: item.language,
        chunkSize: item.chunkSize,
        signal: controller.signal,
        onProgress: (progress) => {
          updateItem(item.id, { progress });
        }
      };

      const result = await enhancedTtsService.generateAudio(generationOptions);

      // Update with success
      const completedItem = {
        status: 'completed' as const,
        result: result.audioUrl,
        completedAt: Date.now(),
        progress: undefined // Clear progress since we're done
      };
      
      updateItem(item.id, completedItem);

      // Notify completion
      if (onItemComplete) {
        onItemComplete({ ...item, ...completedItem });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      
      const failedItem = {
        status: error.name === 'AbortError' ? 'cancelled' as const : 'failed' as const,
        error: errorMessage,
        completedAt: Date.now(),
        progress: undefined
      };
      
      updateItem(item.id, failedItem);

      // Notify error
      if (onItemError && failedItem.status === 'failed') {
        onItemError({ ...item, ...failedItem }, errorMessage);
      }
    } finally {
      // Cleanup
      processingRef.current.delete(item.id);
      abortControllersRef.current.delete(item.id);
      setActiveCount(prev => prev - 1);
    }
  }, [updateItem, onItemComplete, onItemError]);

  // Process queue
  const processQueue = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);

    while (true) {
      // Get pending items that can be processed
      const pendingItems = queue.filter(item => 
        item.status === 'pending' && !processingRef.current.has(item.id)
      );

      if (pendingItems.length === 0) {
        // No more pending items
        if (activeCount === 0 && onQueueEmpty) {
          onQueueEmpty();
        }
        break;
      }

      // Check if we can start more concurrent processes
      if (activeCount >= maxConcurrent) {
        // Wait for some to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // Start processing the next item
      const nextItem = pendingItems[0];
      processItem(nextItem);

      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setIsProcessing(false);
  }, [queue, isProcessing, activeCount, maxConcurrent, processItem, onQueueEmpty]);

  // Auto-start processing when items are added
  useEffect(() => {
    if (autoStart && queue.some(item => item.status === 'pending') && !isProcessing) {
      processQueue();
    }
  }, [queue, autoStart, isProcessing, processQueue]);

  // Clear all completed/failed items
  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(item => 
      !['completed', 'failed', 'cancelled'].includes(item.status)
    ));
  }, []);

  // Cancel all pending items
  const cancelAll = useCallback(() => {
    queue.forEach(item => {
      if (item.status === 'pending' || item.status === 'generating') {
        removeFromQueue(item.id);
      }
    });
  }, [queue, removeFromQueue]);

  // Get queue statistics
  const getStats = useCallback(() => {
    const stats = queue.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: queue.length,
      pending: stats.pending || 0,
      generating: stats.generating || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0,
      cancelled: stats.cancelled || 0,
      activeCount
    };
  }, [queue, activeCount]);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    processQueue,
    clearCompleted,
    cancelAll,
    isProcessing,
    activeCount,
    stats: getStats()
  };
};
