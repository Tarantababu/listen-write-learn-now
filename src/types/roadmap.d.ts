
export interface Roadmap {
  id: string;
  name: string;
  level: string;
  language: string;
  description: string;
  created_at: string;
  updated_at?: string;
  created_by: string;
}

export interface RoadmapNode {
  id: string;
  roadmap_id: string;
  title: string;
  description: string;
  parent_id: string | null;
  position_x: number;
  position_y: number;
  level: string;
  language: string;
  exercise_id: string | null;
  created_at: string;
  updated_at?: string;
}

export interface RoadmapLanguage {
  id: string;
  language: string;
  level: string;
  created_at: string;
}
