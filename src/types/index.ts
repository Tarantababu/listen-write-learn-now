
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: string;
  label?: string;
};

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
  };
};

export type DocsConfig = {
  mainNav: NavItem[];
  sidebarNav: SidebarNavItem[];
};

export type SidebarNavItem = {
  title: string;
  disabled?: boolean;
  external?: boolean;
  icon?: string;
} & (
  | {
      href: string;
      items?: never;
    }
  | {
      href?: string;
      items: NavLink[];
    }
);

export type NavLink = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
};

export type MainNavItem = NavItem;

export type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export interface Option {
  label: string;
  value: string;
  icon?: LucideIcon;
}

export type SettingsConfig = {
  name: string;
  description: string;
  motto: string;
  features: {
    darkMode: boolean;
    pushNotifications: boolean;
    aiAssistance: boolean;
  };
};

export type Language = 
  | 'german' 
  | 'french' 
  | 'spanish' 
  | 'italian' 
  | 'portuguese' 
  | 'english' 
  | 'dutch' 
  | 'swedish' 
  | 'norwegian'
  | 'turkish'
  | 'russian'
  | 'polish'
  | 'chinese'
  | 'japanese'
  | 'korean'
  | 'hindi'
  | 'arabic';

// Exercise types
export interface Exercise {
  id: string;
  title: string;
  text: string;
  language: Language;
  tags: string[];
  audioUrl?: string;
  createdAt: string; // Changed from Date to string
  completionCount: number;
  isCompleted: boolean;
  directoryId?: string | null;
  default_exercise_id?: string | null;
  archived?: boolean;
}

// Directory types
export interface Directory {
  id: string;
  name: string;
  parentId?: string | null;
  userId: string;
  createdAt: string; // Changed from Date to string
  updatedAt: string; // Added updatedAt field
}

// Vocabulary types
export interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  exampleSentence: string;
  language: Language;
  audioUrl?: string;
  userId: string;
  createdAt: string; // Changed from Date to string
  updatedAt: string; // Changed from Date to string
  exerciseId?: string;
}

// User Settings types
export interface UserSettings {
  id?: string;
  userId?: string;
  selectedLanguage: Language;
  aiAssistanceEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  darkModeEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  learningLanguages: Language[];
}

// Blog types
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
}

// Language Level types - changed to union type instead of interface
export type LanguageLevel = 
  | 'Level 1' 
  | 'Level 2' 
  | 'Level 3' 
  | 'Level 4' 
  | 'Level 5' 
  | 'Level 6' 
  | 'Level 7';

// Roadmap types - Updated to match features/roadmap types
export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  level: string;
  position: { x: number; y: number };
  isCompleted: boolean;
  isUnlocked: boolean;
  prerequisites: string[];
  exerciseCount: number;
  type: 'exercise' | 'milestone' | 'checkpoint';
  roadmapId?: string; // Made optional to match features/roadmap types
  isBonus?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// JSON type for generic JSON data
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
