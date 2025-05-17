
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../utils/test-utils';
import ExerciseFormModal from '@/components/exercises/ExerciseFormModal';

// Mock dependencies
vi.mock('@/contexts/ExerciseContext', () => ({
  useExerciseContext: () => ({
    canCreateMore: true,
    canEdit: true,
    exerciseLimit: 10,
  }),
}));

vi.mock('@/components/ExerciseForm', () => ({
  default: ({ onSuccess }) => (
    <div>
      <span>Exercise Form Component</span>
      <button onClick={onSuccess}>Save Exercise</button>
    </div>
  ),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('ExerciseFormModal', () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    mode: 'create' as const,
  };

  it('renders create exercise form when mode is create', () => {
    render(<ExerciseFormModal {...defaultProps} />);
    
    expect(screen.getByText('Create New Exercise')).toBeInTheDocument();
    expect(screen.getByText('Add a new exercise for dictation practice')).toBeInTheDocument();
    expect(screen.getByText('Exercise Form Component')).toBeInTheDocument();
  });

  it('renders edit exercise form when mode is edit', () => {
    render(<ExerciseFormModal {...defaultProps} mode="edit" />);
    
    expect(screen.getByText('Edit Exercise')).toBeInTheDocument();
    expect(screen.getByText('Update your exercise details')).toBeInTheDocument();
  });

  it('shows upgrade prompt when user cannot create more exercises', () => {
    vi.mock('@/contexts/ExerciseContext', () => ({
      useExerciseContext: () => ({
        canCreateMore: false,
        canEdit: true,
        exerciseLimit: 10,
      }),
    }), { virtual: true });

    // Re-render with the new mock
    render(<ExerciseFormModal {...defaultProps} />);
    
    expect(screen.getByText('Premium Subscription Required')).toBeInTheDocument();
    expect(screen.getByText('You\'ve reached the limit of 10 exercises.')).toBeInTheDocument();
  });
});
