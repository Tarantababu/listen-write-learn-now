
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const GRAMMAR_OPTIONS = [
  { id: 'present-tense', label: 'Present Tense' },
  { id: 'past-tense', label: 'Past Tense' },
  { id: 'future-tense', label: 'Future Tense' },
  { id: 'perfect-aspects', label: 'Perfect Aspects' },
  { id: 'progressive-aspects', label: 'Progressive Aspects' },
  { id: 'word-order', label: 'Word Order' },
  { id: 'complex-sentences', label: 'Complex Sentences' },
  { id: 'passive-voice', label: 'Passive Voice' },
  { id: 'modal-verbs', label: 'Modal Verbs' },
  { id: 'conditionals', label: 'Conditionals' },
  { id: 'subjunctive', label: 'Subjunctive' },
  { id: 'articles', label: 'Articles' },
  { id: 'gender-agreement', label: 'Gender Agreement' },
  { id: 'case-systems', label: 'Case Systems' }
];

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

      <div className="flex flex-wrap gap-2">
        {GRAMMAR_OPTIONS.map((option) => {
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
  );
};
