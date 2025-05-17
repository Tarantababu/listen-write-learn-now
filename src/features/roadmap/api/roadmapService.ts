
import { Language, LanguageLevel } from '@/types';
import { RoadmapItem, RoadmapNode } from '../types';

/**
 * Completely stubbed implementation of the roadmap service API layer
 * This prevents TypeScript errors while removing the actual functionality
 */
class RoadmapServiceAPI {
  /**
   * Stub implementation for getRoadmapsForLanguage
   * Returns an empty array with no database calls
   */
  async getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]> {
    console.log('Stub roadmapService.getRoadmapsForLanguage called with language:', language);
    return [];
  }

  /**
   * Stub implementation for getUserRoadmaps
   * Returns an empty array with no database calls
   */
  async getUserRoadmaps(language: Language): Promise<RoadmapItem[]> {
    console.log('Stub roadmapService.getUserRoadmaps called with language:', language);
    return [];
  }

  /**
   * Stub implementation for initializeRoadmap
   * Returns a placeholder ID with no database calls
   */
  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<string> {
    console.log('Stub roadmapService.initializeRoadmap called with level:', level, 'language:', language);
    return 'roadmap-deprecated';
  }

  /**
   * Stub implementation for getRoadmapNodes
   * Returns an empty array with no database calls
   */
  async getRoadmapNodes(roadmapId: string): Promise<RoadmapNode[]> {
    console.log('Stub roadmapService.getRoadmapNodes called with roadmapId:', roadmapId);
    return [];
  }

  /**
   * Stub implementation for getNodeDetails
   * Returns a dummy object with no database calls
   */
  async getNodeDetails(nodeId: string): Promise<any | null> {
    console.log('Stub roadmapService.getNodeDetails called with nodeId:', nodeId);
    return null;
  }

  /**
   * Stub implementation for recordNodeCompletion
   * Returns a dummy object with no database calls
   */
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<any> {
    console.log('Stub roadmapService.recordNodeCompletion called with nodeId:', nodeId, 'accuracy:', accuracy);
    return {
      completionCount: 0,
      isCompleted: false,
    };
  }

  /**
   * Stub implementation for markNodeAsCompleted
   * Does nothing and returns void with no database calls
   */
  async markNodeAsCompleted(nodeId: string): Promise<void> {
    console.log('Stub roadmapService.markNodeAsCompleted called with nodeId:', nodeId);
    // Do nothing
  }
}

export const roadmapService = new RoadmapServiceAPI();
