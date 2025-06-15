
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const GRAMMAR_OPTIONS = [
  { id: 'past-tense', label: 'Past Tense', category: 'Verbs' },
  { id: 'future-tense', label: 'Future Tense', category: 'Verbs' },
  { id: 'conditionals', label: 'Conditionals', category: 'Advanced' },
  { id: 'passive-voice', label: 'Passive Voice', category: 'Advanced' },
  { id: 'subjunctive', label: 'Subjunctive', category: 'Advanced' },
  { id: 'articles', label: 'Articles', category: 'Basics' },
  { id: 'prepositions', label: 'Prepositions', category: 'Basics' },
  { id: 'pronouns', label: 'Pronouns', category: 'Basics' },
  { id: 'adjectives', label: 'Adjectives', category: 'Basics' },
  { id: 'adverbs', label: 'Adverbs', category: 'Basics' },
  { id: 'modal-verbs', label: 'Modal Verbs', category: 'Verbs' },
  { id: 'phrasal-verbs', label: 'Phrasal Verbs', category: 'Verbs' }
];

const GRAMMAR_CATEGORIES = {
  'Basics': 'bg-blue-100 text-blue-700 border-blue-200',
  'Verbs': 'bg-green-100 text-green-700 border-green-200',
  'Advanced': 'bg-purple-100 text-purple-700 border-purple-200'
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
            <h5 className="text-sm font-medium text-muted-foreground">
              {category}
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
