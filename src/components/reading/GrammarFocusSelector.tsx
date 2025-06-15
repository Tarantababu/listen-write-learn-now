
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const GRAMMAR_OPTIONS = [
  // Verb Forms & Tenses
  { id: 'present-tense', label: 'Present Tense', category: 'Verb Forms' },
  { id: 'past-tense', label: 'Past Tense', category: 'Verb Forms' },
  { id: 'future-tense', label: 'Future Tense', category: 'Verb Forms' },
  { id: 'perfect-aspects', label: 'Perfect Aspects', category: 'Verb Forms' },
  { id: 'progressive-aspects', label: 'Progressive Aspects', category: 'Verb Forms' },
  
  // Sentence Structure
  { id: 'word-order', label: 'Word Order', category: 'Sentence Structure' },
  { id: 'complex-sentences', label: 'Complex Sentences', category: 'Sentence Structure' },
  { id: 'passive-voice', label: 'Passive Voice', category: 'Sentence Structure' },
  
  // Modality & Mood
  { id: 'modal-verbs', label: 'Modal Verbs', category: 'Modality & Mood' },
  { id: 'conditionals', label: 'Conditionals', category: 'Modality & Mood' },
  { id: 'subjunctive', label: 'Subjunctive', category: 'Modality & Mood' },
  
  // Noun Systems
  { id: 'articles', label: 'Articles', category: 'Noun Systems' },
  { id: 'gender-agreement', label: 'Gender Agreement', category: 'Noun Systems' },
  { id: 'case-systems', label: 'Case Systems', category: 'Noun Systems' }
];

const GRAMMAR_CATEGORIES = {
  'Verb Forms': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  'Sentence Structure': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  'Modality & Mood': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  'Noun Systems': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
};

interface GrammarFocusSelectorProps {
  selectedGrammar: string[];
  onGrammarToggle: (grammarId: string) => void;
  maxSelections?: number;
}

export const GrammarFocusSelector: React.FC<GrammarFocusSelectorProps> = ({
  selectedGrammar,
  onGrammarToggle,
  maxSelections = 3
}) => {
  const groupedGrammar = GRAMMAR_OPTIONS.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, typeof GRAMMAR_OPTIONS>);

  const canSelectMore = selectedGrammar.length < maxSelections;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Grammar Focus (Optional)</h4>
          <p className="text-sm text-muted-foreground">
            Choose up to {maxSelections} grammar points to emphasize
          </p>
        </div>
        <Badge variant="outline">
          {selectedGrammar.length}/{maxSelections}
        </Badge>
      </div>

      {selectedGrammar.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected:</p>
          <div className="flex flex-wrap gap-2">
            {selectedGrammar.map((grammarId) => {
              const grammar = GRAMMAR_OPTIONS.find(g => g.id === grammarId);
              if (!grammar) return null;
              
              return (
                <Badge
                  key={grammarId}
                  variant="default"
                  className="flex items-center gap-1"
                >
                  {grammar.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onGrammarToggle(grammarId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(groupedGrammar).map(([category, options]) => (
          <div key={category} className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${GRAMMAR_CATEGORIES[category as keyof typeof GRAMMAR_CATEGORIES]}`}>
                {category}
              </span>
            </h5>
            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const isSelected = selectedGrammar.includes(option.id);
                const isDisabled = !isSelected && !canSelectMore;
                
                return (
                  <Badge
                    key={option.id}
                    variant={isSelected ? "default" : "outline"}
                    className={`
                      cursor-pointer transition-all
                      ${!isSelected && canSelectMore ? 'hover:bg-muted' : ''}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => {
                      if (!isDisabled || isSelected) {
                        onGrammarToggle(option.id);
                      }
                    }}
                  >
                    {option.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
