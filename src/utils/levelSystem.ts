import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface LevelInfo {
  level: string;
  title: string;
  description: string;
  cefrEquivalent: string;
  minWords: number;
  maxWords: number | null;
  color: string;
}

export const LANGUAGE_LEVELS: LevelInfo[] = [
  {
    level: "A0",
    title: "Beginner Starter",
    description: "Can recognize isolated high-frequency words and basic phrases",
    cefrEquivalent: "Pre-A1",
    minWords: 0,
    maxWords: 300,
    color: "bg-slate-400"
  },
  {
    level: "A1",
    title: "Elementary",
    description: "Understands and uses routine expressions and elementary vocabulary",
    cefrEquivalent: "A1",
    minWords: 301,
    maxWords: 1200,
    color: "bg-green-400"
  },
  {
    level: "A2",
    title: "Pre-Intermediate",
    description: "Manages simple interactions using concrete vocabulary and set phrases",
    cefrEquivalent: "A2",
    minWords: 1201,
    maxWords: 2500,
    color: "bg-blue-400"
  },
  {
    level: "B1",
    title: "Intermediate",
    description: "Can navigate familiar topics and produce connected discourse on routine matters",
    cefrEquivalent: "B1",
    minWords: 2501,
    maxWords: 5000,
    color: "bg-indigo-500"
  },
  {
    level: "B2",
    title: "Upper Intermediate",
    description: "Can understand abstract topics and discuss them with a range of vocabulary",
    cefrEquivalent: "B2",
    minWords: 5001,
    maxWords: 8000,
    color: "bg-purple-500"
  },
  {
    level: "C1",
    title: "Advanced",
    description: "Uses nuanced vocabulary flexibly for social, academic, and professional contexts",
    cefrEquivalent: "C1",
    minWords: 8001,
    maxWords: 12000,
    color: "bg-amber-500"
  },
  {
    level: "C2",
    title: "Proficient",
    description: "Demonstrates native-like control over idiomatic, technical, and literary language",
    cefrEquivalent: "C2",
    minWords: 12001,
    maxWords: null,
    color: "bg-rose-500"
  }
];

export function getUserLevel(masteredWordsCount: number): LevelInfo {
  const level = LANGUAGE_LEVELS.find(
    level => 
      masteredWordsCount >= level.minWords && 
      (level.maxWords === null || masteredWordsCount <= level.maxWords)
  );
  
  return level || LANGUAGE_LEVELS[LANGUAGE_LEVELS.length - 1];
}

export function getWordsToNextLevel(masteredWordsCount: number): number {
  const currentLevel = getUserLevel(masteredWordsCount);
  
  // If already at the highest level, return 0
  if (currentLevel.maxWords === null) {
    return 0;
  }
  
  return currentLevel.maxWords - masteredWordsCount;
}

export function getLevelProgress(masteredWordsCount: number): number {
  const currentLevel = getUserLevel(masteredWordsCount);
  
  // If at the highest level, return 100%
  if (currentLevel.maxWords === null) {
    return 100;
  }
  
  const levelRange = currentLevel.maxWords - currentLevel.minWords;
  const userProgress = masteredWordsCount - currentLevel.minWords;
  
  return Math.round((userProgress / levelRange) * 100);
}

// Convert this to a React component in JSX file
export function LevelBadge({ masteredWords }: { masteredWords: number }) {
  const level = getUserLevel(masteredWords);
  return {
    level: level.level,
    color: level.color
  };
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}
