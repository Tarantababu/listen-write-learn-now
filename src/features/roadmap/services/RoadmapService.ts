import { supabase } from '@/integrations/supabase/client';
import { Language, LanguageLevel } from '@/types';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '../types';

export interface ServiceResult<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
}

class RoadmapService {
  // Get all roadmaps available for a specific language
  async getRoadmapsByLanguage(language: Language): Promise<ServiceResult<RoadmapItem[]>> {
    try {
      // Query roadmaps that support this language
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*, roadmap_languages(language)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter roadmaps that support the requested language
      const roadmapsForLanguage = data.filter(roadmap => 
        roadmap.roadmap_languages && 
        roadmap.roadmap_languages.some((l: any) => l.language === language)
      );

      // Transform the data to match our RoadmapItem type
      const transformedRoadmaps: RoadmapItem[] = roadmapsForLanguage.map(roadmap => ({
        id: roadmap.id,
        name: roadmap.name,
        level: roadmap.level as LanguageLevel,
        description: roadmap.description,
        language: language,  // Set language explicitly here
        languages: roadmap.roadmap_languages.map((l: any) => l.language),
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at),
        createdBy: roadmap.created_by,
      }));

      return {
        status: 'success',
        data: transformedRoadmaps
      };
    } catch (error: any) {
      console.error('Error fetching roadmaps by language:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // Get roadmaps that a user has enrolled in
  async getUserRoadmaps(language: Language): Promise<ServiceResult<RoadmapItem[]>> {
    try {
      const { data, error } = await supabase
        .from('user_roadmaps')
        .select(`
          id,
          user_id,
          roadmap_id,
          language,
          current_node_id,
          created_at,
          updated_at,
          roadmaps (
            name,
            level,
            description,
            created_at,
            updated_at,
            created_by,
            roadmap_languages (
              language
            )
          )
        `)
        .eq('user_id', supabase.auth.user()?.id)
        .eq('language', language)
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Error fetching user roadmaps:', error);
        return { status: 'error', error: error.message };
      }
  
      if (!data) {
        console.warn('No user roadmaps found for user:', supabase.auth.user()?.id);
        return { status: 'success', data: [] };
      }
  
      // Transform the data to match our RoadmapItem type
      const transformedRoadmaps: RoadmapItem[] = data.map(userRoadmap => {
        const roadmap = userRoadmap.roadmaps;
        return {
          id: userRoadmap.id,
          userId: userRoadmap.user_id,
          roadmapId: userRoadmap.roadmap_id,
          name: roadmap?.name || 'Unnamed Roadmap',
          level: roadmap?.level as LanguageLevel || 'A1',
          description: roadmap?.description || 'No description',
          language: userRoadmap.language,
          languages: roadmap?.roadmap_languages?.map((l: any) => l.language) || [userRoadmap.language],
          currentNodeId: userRoadmap.current_node_id,
          createdAt: new Date(userRoadmap.created_at),
          updatedAt: new Date(userRoadmap.updated_at),
          createdBy: roadmap?.created_by,
        };
      });
  
      return { status: 'success', data: transformedRoadmaps };
    } catch (error: any) {
      console.error('Error fetching user roadmaps:', error);
      return { status: 'error', error: error.message };
    }
  }

  // Initialize a roadmap for the current user
  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<ServiceResult<string>> {
    try {
      // Find a roadmap that matches the specified level and language
      const { data: roadmaps, error: roadmapError } = await supabase
        .from('roadmaps')
        .select('id')
        .eq('level', level)
        .limit(1);
  
      if (roadmapError) {
        console.error('Error finding roadmap:', roadmapError);
        return { status: 'error', error: roadmapError.message };
      }
  
      if (!roadmaps || roadmaps.length === 0) {
        const errorMessage = `No roadmap found for level ${level} and language ${language}`;
        console.warn(errorMessage);
        return { status: 'error', error: errorMessage };
      }
  
      const roadmapId = roadmaps[0].id;
  
      // Insert the new user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .insert([
          {
            user_id: supabase.auth.user()?.id,
            roadmap_id: roadmapId,
            language: language,
          },
        ])
        .select('id')
        .single();
  
      if (userRoadmapError) {
        console.error('Error initializing roadmap:', userRoadmapError);
        return { status: 'error', error: userRoadmapError.message };
      }
  
      return { status: 'success', data: userRoadmap.id };
    } catch (error: any) {
      console.error('Error initializing roadmap:', error);
      return { status: 'error', error: error.message };
    }
  }

  // Get nodes for a specific roadmap
  async getRoadmapNodes(roadmapId: string): Promise<ServiceResult<RoadmapNode[]>> {
    try {
      const { data, error } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .order('position', { ascending: true });
  
      if (error) {
        console.error('Error fetching roadmap nodes:', error);
        return { status: 'error', error: error.message };
      }
  
      // Transform the data to match RoadmapNode type
      const transformedData: RoadmapNode[] = data.map(node => ({
        id: node.id,
        title: node.title,
        description: node.description || '',
        position: node.position,
        isBonus: node.is_bonus || false,
        language: node.language,
        roadmapId: node.roadmap_id,
        defaultExerciseId: node.default_exercise_id,
      }));
  
      return { status: 'success', data: transformedData };
    } catch (error: any) {
      console.error('Error fetching roadmap nodes:', error);
      return { status: 'error', error: error.message };
    }
  }
  
  // Get exercise content for a node
  async getNodeExercise(nodeId: string): Promise<ServiceResult<ExerciseContent | null>> {
    try {
      // First, check if node has a default exercise attached
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('default_exercise_id')
        .eq('id', nodeId)
        .maybeSingle();

      if (nodeError) throw nodeError;
      
      if (nodeData?.default_exercise_id) {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('default_exercises')
          .select('*')
          .eq('id', nodeData.default_exercise_id)
          .maybeSingle();

        if (exerciseError) throw exerciseError;
        
        if (exerciseData) {
          // Check if there's a reading analysis for this exercise
          const { data: analysisData } = await supabase
            .from('reading_analyses')
            .select('id')
            .eq('exercise_id', `roadmap-${nodeId}`)
            .maybeSingle();
          
          const exerciseContent: ExerciseContent = {
            title: exerciseData.title,
            text: exerciseData.text,
            language: exerciseData.language,
            audioUrl: exerciseData.audio_url,
            readingAnalysisId: analysisData?.id || null,
          };
          
          return {
            status: 'success',
            data: exerciseContent
          };
        }
      }
      
      // If no default exercise is found, return basic content based on node
      const basicContent: ExerciseContent = {
        title: "Practice Exercise",
        text: "Sample text for practice. This node doesn't have specific exercise content.",
        language: "english",
        audioUrl: null
      };
      
      return {
        status: 'success',
        data: basicContent
      };
    } catch (error: any) {
      console.error('Error fetching node exercise:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }
  
  // Record completion of a node
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<ServiceResult<NodeCompletionResult>> {
    if (accuracy < 95) {
      return { 
        status: 'success',
        data: { isCompleted: false, completionCount: 0 }
      };
    }

    try {
      // Get roadmap ID from the node
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id')
        .eq('id', nodeId)
        .single();

      if (roadmapError) throw roadmapError;

      // Check if there's existing progress for this node
      const { data: existingProgress, error: progressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('node_id', nodeId)
        .eq('user_id', supabase.auth.user()?.id)
        .maybeSingle();

      if (progressError) throw progressError;

      // Update or create progress record
      if (existingProgress) {
        // If completion_count is already 3, nothing more to do
        if (existingProgress.completion_count >= 3) {
          return { 
            status: 'success',
            data: {
              isCompleted: true,
              completionCount: existingProgress.completion_count
            }
          };
        }

        const newCompletionCount = existingProgress.completion_count + 1;
        const isNewlyCompleted = newCompletionCount >= 3;

        // Update the progress record
        const { error: updateError } = await supabase
          .from('roadmap_nodes_progress')
          .update({
            completion_count: newCompletionCount,
            is_completed: isNewlyCompleted,
            last_practiced_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);

        if (updateError) throw updateError;

        // If newly completed, also update roadmap_progress
        if (isNewlyCompleted) {
          const { error: markCompleteError } = await supabase
            .from('roadmap_progress')
            .upsert({
              user_id: supabase.auth.user()?.id,
              roadmap_id: roadmapData.roadmap_id,
              node_id: nodeId,
              completed: true,
              completed_at: new Date().toISOString(),
            });

          if (markCompleteError) throw markCompleteError;
        }

        return { 
          status: 'success',
          data: {
            isCompleted: isNewlyCompleted,
            completionCount: newCompletionCount
          }
        };

      } else {
        // Create new progress record with completion_count = 1
        const isCompleted = 1 >= 3; // Will be false
        
        const { error: insertError } = await supabase
          .from('roadmap_nodes_progress')
          .insert({
            user_id: supabase.auth.user()?.id,
            roadmap_id: roadmapData.roadmap_id,
            node_id: nodeId,
            completion_count: 1,
            is_completed: isCompleted,
            language: 'english', // Assuming default language
            last_practiced_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;

        return { 
          status: 'success',
          data: {
            isCompleted: false,
            completionCount: 1
          }
        };
      }
    } catch (error: any) {
      console.error('Error updating node completion:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }
  
  // Mark a node as completed (regardless of completion criteria)
  async markNodeAsCompleted(nodeId: string): Promise<ServiceResult<void>> {
    try {
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id')
        .eq('id', nodeId)
        .single();

      if (roadmapError) throw roadmapError;

      const { error: progressError } = await supabase
        .from('roadmap_progress')
        .upsert({
          user_id: supabase.auth.user()?.id,
          roadmap_id: roadmapData.roadmap_id,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      if (progressError) throw progressError;

      return { status: 'success' };
    } catch (error: any) {
      console.error('Error marking node as completed:', error);
      return { status: 'error', error: error.message };
    }
  }
}

export const roadmapService = new RoadmapService();
