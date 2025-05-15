
import { RoadmapNode, ExerciseContent, RoadmapItem } from '../types';

// Keys for storage
const STORAGE_KEYS = {
  CURRENT_ROADMAP: 'roadmap_current',
  ROADMAP_NODES: 'roadmap_nodes',
  USER_ROADMAPS: 'user_roadmaps',
  EXERCISE_CONTENT: 'exercise_content',
  SYNC_QUEUE: 'roadmap_sync_queue',
};

// Define the types for sync queue
interface SyncQueueItem {
  action: 'incrementCompletion' | 'markCompleted';
  nodeId: string;
  data?: any;
  timestamp: number;
}

export class OfflineStorageService {
  /**
   * Store current roadmap for offline use
   */
  public static saveCurrentRoadmap(roadmap: RoadmapItem | null): void {
    if (!roadmap) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ROADMAP);
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROADMAP, JSON.stringify(roadmap));
    } catch (error) {
      console.error('Error saving current roadmap to localStorage:', error);
    }
  }
  
  /**
   * Get current roadmap from storage
   */
  public static getCurrentRoadmap(): RoadmapItem | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_ROADMAP);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving current roadmap from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Store roadmap nodes for offline use
   */
  public static saveRoadmapNodes(roadmapId: string, nodes: RoadmapNode[]): void {
    try {
      const allNodesData = this.getAllRoadmapNodes();
      allNodesData[roadmapId] = nodes;
      localStorage.setItem(STORAGE_KEYS.ROADMAP_NODES, JSON.stringify(allNodesData));
    } catch (error) {
      console.error('Error saving roadmap nodes to localStorage:', error);
    }
  }
  
  /**
   * Get nodes for a specific roadmap
   */
  public static getRoadmapNodes(roadmapId: string): RoadmapNode[] {
    try {
      const allNodesData = this.getAllRoadmapNodes();
      return allNodesData[roadmapId] || [];
    } catch (error) {
      console.error('Error retrieving roadmap nodes from localStorage:', error);
      return [];
    }
  }
  
  /**
   * Get all stored roadmap nodes
   */
  private static getAllRoadmapNodes(): Record<string, RoadmapNode[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROADMAP_NODES);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error parsing roadmap nodes from localStorage:', error);
      return {};
    }
  }
  
  /**
   * Store user roadmaps for offline use
   */
  public static saveUserRoadmaps(roadmaps: RoadmapItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ROADMAPS, JSON.stringify(roadmaps));
    } catch (error) {
      console.error('Error saving user roadmaps to localStorage:', error);
    }
  }
  
  /**
   * Get stored user roadmaps
   */
  public static getUserRoadmaps(): RoadmapItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_ROADMAPS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error retrieving user roadmaps from localStorage:', error);
      return [];
    }
  }
  
  /**
   * Store exercise content for offline use
   */
  public static saveExerciseContent(nodeId: string, content: ExerciseContent): void {
    try {
      const allContentData = this.getAllExerciseContent();
      allContentData[nodeId] = content;
      localStorage.setItem(STORAGE_KEYS.EXERCISE_CONTENT, JSON.stringify(allContentData));
    } catch (error) {
      console.error('Error saving exercise content to localStorage:', error);
    }
  }
  
  /**
   * Get exercise content for a specific node
   */
  public static getExerciseContent(nodeId: string): ExerciseContent | null {
    try {
      const allContentData = this.getAllExerciseContent();
      return allContentData[nodeId] || null;
    } catch (error) {
      console.error('Error retrieving exercise content from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Get all stored exercise content
   */
  private static getAllExerciseContent(): Record<string, ExerciseContent> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXERCISE_CONTENT);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error parsing exercise content from localStorage:', error);
      return {};
    }
  }
  
  /**
   * Add item to sync queue for processing when online
   */
  public static addToSyncQueue(item: Omit<SyncQueueItem, 'timestamp'>): void {
    try {
      const queue = this.getSyncQueue();
      queue.push({
        ...item,
        timestamp: Date.now(),
      });
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }
  
  /**
   * Get all items in the sync queue
   */
  public static getSyncQueue(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error retrieving sync queue from localStorage:', error);
      return [];
    }
  }
  
  /**
   * Clear processed items from sync queue
   */
  public static clearSyncQueue(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
    } catch (error) {
      console.error('Error clearing sync queue:', error);
    }
  }
  
  /**
   * Remove specific item from sync queue
   */
  public static removeFromSyncQueue(index: number): void {
    try {
      const queue = this.getSyncQueue();
      queue.splice(index, 1);
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error removing item from sync queue:', error);
    }
  }
}

export default OfflineStorageService;
