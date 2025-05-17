
import { supabase } from '@/integrations/supabase/client';
import { RoadmapProgressData, ProgressResponse, NodeProgressDetails } from '../types/service-types';

export class ProgressService {
  /**
   * Stub implementation for getRoadmapProgress
   * Returns a mock response with no actual database calls
   */
  async getRoadmapProgress(roadmapId: string): Promise<ProgressResponse> {
    console.log('Stub ProgressService.getRoadmapProgress called with roadmapId:', roadmapId);
    
    return {
      success: true,
      data: {
        roadmapId,
        completedNodes: [],
        nodeProgress: {},
        completionPercentage: 0
      }
    };
  }
  
  /**
   * Stub implementation for resetProgress
   * Returns a mock response with no actual database calls
   */
  async resetProgress(roadmapId: string): Promise<ProgressResponse> {
    console.log('Stub ProgressService.resetProgress called with roadmapId:', roadmapId);
    
    return {
      success: true
    };
  }
}
