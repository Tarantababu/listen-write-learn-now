
/**
 * Stub service for roadmap functionality that has been deprecated
 * This provides empty implementations to prevent errors in any code that might reference it
 */

export class RoadmapService {
  async getRoadmapsForLanguage() {
    return [];
  }

  async getUserRoadmaps() {
    return [];
  }

  async initializeRoadmap() {
    return '';
  }

  async getRoadmapNodes() {
    return [];
  }

  async getNodeExerciseContent() {
    return null;
  }

  async recordNodeCompletion() {
    return {
      completionCount: 0,
      isCompleted: false,
      lastPracticedAt: new Date()
    };
  }

  async markNodeCompleted() {
    // Do nothing
  }

  async updateRoadmapNodeProgress() {
    // Do nothing
  }

  async updateCurrentNodeInUserRoadmap() {
    // Do nothing
  }
}

export const roadmapService = new RoadmapService();
