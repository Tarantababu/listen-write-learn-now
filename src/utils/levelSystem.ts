
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
    description: "Learning the basics",
    cefrEquivalent: "Pre-A1",
    minWords: 0,
    maxWords: 100,
    color: "bg-slate-400"
  },
  {
    level: "A1",
    title: "Elementary",
    description: "Can handle basic everyday expressions",
    cefrEquivalent: "A1",
    minWords: 101,
    maxWords: 500,
    color: "bg-green-400"
  },
  {
    level: "A2",
    title: "Pre-Intermediate",
    description: "Can communicate simple tasks",
    cefrEquivalent: "A2",
    minWords: 501,
    maxWords: 1000,
    color: "bg-blue-400"
  },
  {
    level: "B1",
    title: "Intermediate",
    description: "Intermediate use of language",
    cefrEquivalent: "B1",
    minWords: 1001,
    maxWords: 2000,
    color: "bg-indigo-500"
  },
  {
    level: "B2",
    title: "Upper Intermediate",
    description: "Independent, extended vocabulary",
    cefrEquivalent: "B2",
    minWords: 2001,
    maxWords: 4000,
    color: "bg-purple-500"
  },
  {
    level: "C1",
    title: "Advanced",
    description: "Advanced vocabulary range",
    cefrEquivalent: "C1",
    minWords: 4001,
    maxWords: 7000,
    color: "bg-amber-500"
  },
  {
    level: "C2",
    title: "Proficient",
    description: "Near-native command of vocabulary",
    cefrEquivalent: "C2",
    minWords: 7001,
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
