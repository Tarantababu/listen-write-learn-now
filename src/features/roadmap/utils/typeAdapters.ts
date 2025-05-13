
import { Language, LanguageLevel } from "@/types";
import { RoadmapItem, RoadmapNode, ExerciseContent } from "../types";

/**
 * Adapts database roadmap data to the RoadmapItem type
 */
export function adaptToRoadmapItem(data: any): RoadmapItem {
  return {
    id: data.id,
    name: data.name || data.roadmaps?.name || '',
    level: (data.level || data.roadmaps?.level) as LanguageLevel,
    language: data.language as Language,
    languages: Array.isArray(data.languages) ? data.languages : [data.language],
    roadmapId: data.roadmap_id || data.roadmapId,
    userId: data.user_id || data.userId,
    currentNodeId: data.current_node_id || data.currentNodeId,
    description: data.description || data.roadmaps?.description,
    createdAt: data.created_at ? new Date(data.created_at) : 
              data.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : 
              data.updatedAt ? new Date(data.updatedAt) : undefined,
    createdBy: data.created_by || data.createdBy
  };
}

/**
 * Adapts database node data to the RoadmapNode type
 */
export function adaptToRoadmapNode(data: any): RoadmapNode {
  return {
    id: data.id,
    title: data.title || '',
    description: data.description || '',
    position: data.position || 0,
    isBonus: data.is_bonus || data.isBonus || false,
    language: data.language || '',
    status: data.status,
    progressCount: data.progress_count || data.progressCount,
    roadmapId: data.roadmap_id || data.roadmapId,
    createdAt: data.created_at ? new Date(data.created_at) : 
              data.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : 
              data.updatedAt ? new Date(data.updatedAt) : undefined,
    defaultExerciseId: data.default_exercise_id || data.defaultExerciseId
  };
}

/**
 * Adapts exercise data to the ExerciseContent type
 */
export function adaptToExerciseContent(data: any): ExerciseContent {
  return {
    id: data.id,
    title: data.title || '',
    text: data.text || '',
    language: data.language as Language,
    audioUrl: data.audio_url || data.audioUrl,
    readingAnalysisId: data.reading_analysis_id || data.readingAnalysisId,
    tags: data.tags || []
  };
}
