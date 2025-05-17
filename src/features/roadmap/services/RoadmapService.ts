
import { RoadmapServiceInterface, NodeCompletionResult } from '../types/service-types';
import { RoadmapItem, RoadmapNode, ExerciseContent } from '../types';
import { Language, LanguageLevel } from '@/types';

export class RoadmapService implements RoadmapServiceInterface {
  /**
   * Stub implementation that returns an empty array
   */
  async getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]> {
    console.log('Stub RoadmapService.getRoadmapsForLanguage called with language:', language);
    return [];
  }

  /**
   * Stub implementation that returns an empty array
   */
  async getUserRoadmaps(language: Language): Promise<RoadmapItem[]> {
    console.log('Stub RoadmapService.getUserRoadmaps called with language:', language);
    return [];
  }

  /**
   * Stub implementation that returns a mock ID
   */
  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<string> {
    console.log('Stub RoadmapService.initializeRoadmap called with level:', level, 'language:', language);
    return 'mock-roadmap-id';
  }

  /**
   * Stub implementation that returns an empty array
   */
  async getRoadmapNodes(userRoadmapId: string): Promise<RoadmapNode[]> {
    console.log('Stub RoadmapService.getRoadmapNodes called with userRoadmapId:', userRoadmapId);
    return [];
  }

  /**
   * Stub implementation that returns null
   */
  async getNodeExerciseContent(nodeId: string): Promise<ExerciseContent | null> {
    console.log('Stub RoadmapService.getNodeExerciseContent called with nodeId:', nodeId);
    return null;
  }

  /**
   * Stub implementation that returns mock result
   */
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<NodeCompletionResult> {
    console.log('Stub RoadmapService.recordNodeCompletion called with nodeId:', nodeId, 'accuracy:', accuracy);
    return {
      completionCount: 0,
      isCompleted: false,
      lastPracticedAt: new Date()
    };
  }

  /**
   * Stub implementation that does nothing
   */
  async markNodeCompleted(nodeId: string): Promise<void> {
    console.log('Stub RoadmapService.markNodeCompleted called with nodeId:', nodeId);
    // Do nothing
  }
}

// Add a default export for the service
export const roadmapService = new RoadmapService();
