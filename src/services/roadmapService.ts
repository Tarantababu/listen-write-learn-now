import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface Roadmap {
  id: string;
  name: string;
  level: string;
  description: string | null;
  created_at: string;  // Changed from Date to string to match Supabase response
  updated_at: string;  // Changed from Date to string to match Supabase response
  created_by: string | null;
}

export interface RoadmapNode {
  id: string;
  roadmap_id: string;
  position: number;
  title: string;
  description: string | null;
  default_exercise_id: string | null;
  is_bonus: boolean;
  created_at: string;  // Changed from Date to string
  updated_at: string;  // Changed from Date to string
}

export interface RoadmapProgress {
  id: string;
  user_id: string;
  roadmap_id: string;
  node_id: string;
  completed: boolean;
  completed_at: string | null;  // Changed from Date | null to string | null
  created_at: string;  // Changed from Date to string
  updated_at: string;  // Changed from Date to string
}

export interface UserRoadmap {
  id: string;
  user_id: string;
  roadmap_id: string;
  language: string;
  current_node_id: string | null;
  created_at: string;  // Changed from Date to string
  updated_at: string;  // Changed from Date to string
  roadmap?: Roadmap;
  current_node?: RoadmapNode;
}

// Roadmap Management
export async function fetchRoadmaps() {
  try {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .order('level');

    if (error) throw error;
    return data as Roadmap[];
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    toast.error('Failed to fetch roadmaps');
    return [];
  }
}

export async function fetchRoadmap(id: string) {
  try {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Roadmap;
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    toast.error('Failed to fetch roadmap');
    return null;
  }
}

export async function createRoadmap(roadmap: Omit<Roadmap, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('roadmaps')
      .insert([roadmap])
      .select()
      .single();

    if (error) throw error;
    toast.success('Roadmap created successfully');
    return data as Roadmap;
  } catch (error) {
    console.error('Error creating roadmap:', error);
    toast.error('Failed to create roadmap');
    throw error;
  }
}

export async function updateRoadmap(id: string, updates: Partial<Omit<Roadmap, 'id' | 'created_at'>>) {
  try {
    const { data, error } = await supabase
      .from('roadmaps')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('Roadmap updated successfully');
    return data as Roadmap;
  } catch (error) {
    console.error('Error updating roadmap:', error);
    toast.error('Failed to update roadmap');
    throw error;
  }
}

export async function deleteRoadmap(id: string) {
  try {
    const { error } = await supabase
      .from('roadmaps')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Roadmap deleted successfully');
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    toast.error('Failed to delete roadmap');
    throw error;
  }
}

// Roadmap Nodes
export async function fetchRoadmapNodes(roadmapId: string) {
  try {
    const { data, error } = await supabase
      .from('roadmap_nodes')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('position');

    if (error) throw error;
    return data as RoadmapNode[];
  } catch (error) {
    console.error('Error fetching roadmap nodes:', error);
    toast.error('Failed to fetch roadmap nodes');
    return [];
  }
}

export async function createRoadmapNode(node: Omit<RoadmapNode, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('roadmap_nodes')
      .insert([node])
      .select()
      .single();

    if (error) throw error;
    toast.success('Roadmap node created successfully');
    return data as RoadmapNode;
  } catch (error) {
    console.error('Error creating roadmap node:', error);
    toast.error('Failed to create roadmap node');
    throw error;
  }
}

export async function updateRoadmapNode(id: string, updates: Partial<Omit<RoadmapNode, 'id' | 'created_at'>>) {
  try {
    const { data, error } = await supabase
      .from('roadmap_nodes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('Roadmap node updated successfully');
    return data as RoadmapNode;
  } catch (error) {
    console.error('Error updating roadmap node:', error);
    toast.error('Failed to update roadmap node');
    throw error;
  }
}

export async function deleteRoadmapNode(id: string) {
  try {
    const { error } = await supabase
      .from('roadmap_nodes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Roadmap node deleted successfully');
  } catch (error) {
    console.error('Error deleting roadmap node:', error);
    toast.error('Failed to delete roadmap node');
    throw error;
  }
}

// User Progress
export async function fetchUserRoadmaps(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_roadmaps')
      .select(`
        *,
        roadmap:roadmaps(*),
        current_node:roadmap_nodes(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data as (UserRoadmap & { 
      roadmap: Roadmap, 
      current_node: RoadmapNode | null 
    })[];
  } catch (error) {
    console.error('Error fetching user roadmaps:', error);
    toast.error('Failed to fetch your roadmaps');
    return [];
  }
}

export async function assignRoadmapToUser(roadmapId: string, userId: string, language: string) {
  try {
    // Get the first node in the roadmap
    const { data: firstNode, error: nodeError } = await supabase
      .from('roadmap_nodes')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .eq('position', 1)
      .single();

    if (nodeError) throw nodeError;

    // Create the user-roadmap assignment
    const { data, error } = await supabase
      .from('user_roadmaps')
      .insert([{
        user_id: userId,
        roadmap_id: roadmapId,
        language,
        current_node_id: firstNode.id
      }])
      .select()
      .single();

    if (error) throw error;
    toast.success('Roadmap assigned successfully');
    return data as UserRoadmap;
  } catch (error) {
    console.error('Error assigning roadmap:', error);
    toast.error('Failed to assign roadmap');
    throw error;
  }
}

export async function updateUserProgress(userId: string, nodeId: string, completed: boolean = true) {
  try {
    // Get the node to find the roadmap_id
    const { data: node, error: nodeError } = await supabase
      .from('roadmap_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (nodeError) throw nodeError;

    // Check if a progress entry exists
    const { data: existingProgress, error: checkError } = await supabase
      .from('roadmap_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('node_id', nodeId)
      .maybeSingle();

    if (checkError) throw checkError;

    let progressResult;
    const now = new Date().toISOString();

    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('roadmap_progress')
        .update({
          completed,
          completed_at: completed ? now : null,
          updated_at: now
        })
        .eq('id', existingProgress.id)
        .select()
        .single();

      if (error) throw error;
      progressResult = data;
    } else {
      // Create new progress entry
      const { data, error } = await supabase
        .from('roadmap_progress')
        .insert([{
          user_id: userId,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          completed,
          completed_at: completed ? now : null
        }])
        .select()
        .single();

      if (error) throw error;
      progressResult = data;
    }

    if (completed) {
      // If completed, update user's current node to the next one
      const { data: nextNode } = await supabase
        .callRpc('get_next_roadmap_node', {
          roadmap_id_param: node.roadmap_id,
          current_position_param: node.position
        });

      if (nextNode) {
        // Update user's current node
        await supabase
          .from('user_roadmaps')
          .update({
            current_node_id: nextNode,
            updated_at: now
          })
          .eq('user_id', userId)
          .eq('roadmap_id', node.roadmap_id);
      }
    }

    toast.success('Progress updated successfully');
    return progressResult as RoadmapProgress;
  } catch (error) {
    console.error('Error updating progress:', error);
    toast.error('Failed to update progress');
    throw error;
  }
}

export async function fetchUserProgress(userId: string, roadmapId: string) {
  try {
    const { data, error } = await supabase
      .from('roadmap_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('roadmap_id', roadmapId);

    if (error) throw error;
    return data as RoadmapProgress[];
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }
}

export async function isNodeUnlocked(userId: string, nodeId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('is_node_unlocked', {
        user_id_param: userId,
        node_id_param: nodeId
      });

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking node unlock status:', error);
    return false;
  }
}
