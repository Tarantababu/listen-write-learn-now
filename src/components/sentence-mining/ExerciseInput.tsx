
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Send } from 'lucide-react';

interface ExerciseInputProps {
  onSubmit: (response: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export const ExerciseInput: React.FC<ExerciseInputProps> = ({
  onSubmit,
  disabled,
  placeholder = "Type your answer here..."
}) => {
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(userInput.trim());
      setUserInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-10">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isSubmitting}
            className="text-base py-3"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <Button
            type="submit"
            disabled={!userInput.trim() || disabled || isSubmitting}
            className="w-full py-3 text-base"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit <Send className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isSubmitting}
              className="flex-1"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <Button
              type="submit"
              disabled={!userInput.trim() || disabled || isSubmitting}
              className="px-6"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Submit <Send className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
