
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../utils/test-utils';
import ExerciseFormModal from '@/components/exercises/ExerciseFormModal';
import { useExerciseContext } from '@/contexts/ExerciseContext';

// Mock dependencies
vi.mock('@/contexts/ExerciseContext', () => ({
  useExerciseContext: vi.fn().mockReturnValue({
    canCreateMore: true,
    canEdit: true,
    exerciseLimit: 10,
    // Adding all the required properties from ExerciseContextType
    exercises: [],
    selectedExercise: null,
    defaultExercises: [],
    addExercise: vi.fn().mockResolvedValue({}),
    updateExercise: vi.fn().mockResolvedValue({}),
    deleteExercise: vi.fn().mockResolvedValue({}),
    selectExercise: vi.fn(),
    markProgress: vi.fn().mockResolvedValue({}),
    filterExercisesByLanguage: vi.fn().mockReturnValue([]),
    moveExerciseToDirectory: vi.fn().mockResolvedValue({}),
    copyDefaultExercise: vi.fn().mockResolvedValue({}),
    hasReadingAnalysis: vi.fn().mockResolvedValue(false),
    loading: false,
    defaultExercisesLoading: false,
    refreshExercises: vi.fn().mockResolvedValue({}),
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

  it('shows upgrade prompt when user cannot create more exercises', async () => {
    // Override the mock for this test
    vi.mocked(useExerciseContext).mockReturnValue({
      canCreateMore: false,
      canEdit: true,
      exerciseLimit: 10,
      // Adding all the required properties from ExerciseContextType
      exercises: [],
      selectedExercise: null,
      defaultExercises: [],
      addExercise: vi.fn().mockResolvedValue({}),
      updateExercise: vi.fn().mockResolvedValue({}),
      deleteExercise: vi.fn().mockResolvedValue({}),
      selectExercise: vi.fn(),
      markProgress: vi.fn().mockResolvedValue({}),
      filterExercisesByLanguage: vi.fn().mockReturnValue([]),
      moveExerciseToDirectory: vi.fn().mockResolvedValue({}),
      copyDefaultExercise: vi.fn().mockResolvedValue({}),
      hasReadingAnalysis: vi.fn().mockResolvedValue(false),
      loading: false,
      defaultExercisesLoading: false,
      refreshExercises: vi.fn().mockResolvedValue({}),
    });

    render(<ExerciseFormModal {...defaultProps} />);
    
    expect(screen.getByText('Premium Subscription Required')).toBeInTheDocument();
    expect(screen.getByText('You\'ve reached the limit of 10 exercises.')).toBeInTheDocument();
  });
});
