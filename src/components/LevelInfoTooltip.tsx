
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { HelpCircle } from 'lucide-react';

interface LevelInfo {
  level: string;
  minWords: number;
  maxWords: number | null;
  description: string;
  cefrEquivalent: string;
}

const levels: LevelInfo[] = [
  { level: 'A0', minWords: 0, maxWords: 300, description: 'Can recognize isolated high-frequency words and basic phrases', cefrEquivalent: 'Pre-A1' },
  { level: 'A1', minWords: 301, maxWords: 1200, description: 'Understands and uses routine expressions and elementary vocabulary', cefrEquivalent: 'A1' },
  { level: 'A2', minWords: 1201, maxWords: 2500, description: 'Manages simple interactions using concrete vocabulary and set phrases', cefrEquivalent: 'A2' },
  { level: 'B1', minWords: 2501, maxWords: 5000, description: 'Can navigate familiar topics and produce connected discourse on routine matters', cefrEquivalent: 'B1' },
  { level: 'B2', minWords: 5001, maxWords: 8000, description: 'Can understand abstract topics and discuss them with a range of vocabulary', cefrEquivalent: 'B2' },
  { level: 'C1', minWords: 8001, maxWords: 12000, description: 'Uses nuanced vocabulary flexibly for social, academic, and professional contexts', cefrEquivalent: 'C1' },
  { level: 'C2', minWords: 12001, maxWords: null, description: 'Demonstrates native-like control over idiomatic, technical, and literary language', cefrEquivalent: 'C2' }
];

const LevelInfoTooltip: React.FC = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
        <div className="p-4 bg-background border rounded-md shadow-md">
          <h4 className="font-medium mb-3 text-sm">Language Proficiency Levels</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Level</th>
                  <th className="px-3 py-2 text-left font-medium">Words</th>
                  <th className="px-3 py-2 text-left font-medium">CEFR</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level) => (
                  <tr key={level.level} className="border-t hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium">{level.level}</td>
                    <td className="px-3 py-2">
                      {level.maxWords 
                        ? `${level.minWords.toLocaleString()}-${level.maxWords.toLocaleString()}`
                        : `${level.minWords.toLocaleString()}+`}
                    </td>
                    <td className="px-3 py-2">{level.cefrEquivalent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <p>Hover over any level to see description</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LevelInfoTooltip;
