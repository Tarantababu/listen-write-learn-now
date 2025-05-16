
export interface NodeProgressDetails {
  nodeId: string;
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt?: Date;
  accuracyHistory?: number[];
}

export interface RoadmapProgressData {
  roadmapId: string;
  completedNodes: string[];
  nodeProgress: Record<string, NodeProgressDetails>;
  completionPercentage: number;
}

export interface ProgressResponse {
  success: boolean;
  data?: RoadmapProgressData;
  error?: string;
}
