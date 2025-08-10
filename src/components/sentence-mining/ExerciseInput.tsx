
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExerciseInputProps {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export const ExerciseInput: React.FC<ExerciseInputProps> = ({ onSubmit, disabled = false }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onSubmit(answer.trim());
      setAnswer('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Enter your answer..."
        disabled={disabled}
        className="flex-1"
      />
      <Button type="submit" disabled={disabled || !answer.trim()}>
        Submit
      </Button>
    </form>
  );
};
