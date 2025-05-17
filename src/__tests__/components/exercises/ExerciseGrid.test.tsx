
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../utils/test-utils';
import ExerciseGrid from '@/components/exercises/ExerciseGrid';
import { Exercise } from '@/types';

describe('ExerciseGrid', () => {
  const mockExercises: Exercise[] = [
    {
      id: '1',
      title: 'Test Exercise 1',
      text: 'This is a test exercise',
      language: 'english',
      tags: ['test', 'example'],
      createdAt: new Date('2023-01-01T00:00:00Z'),
      user_id: 'user-123',
      completionCount: 0,
      isCompleted: false,
      directoryId: null
    },
    {
      id: '2',
      title: 'Test Exercise 2',
      text: 'Another test exercise',
      language: 'english',
      tags: ['test', 'sample'],
      createdAt: new Date('2023-01-02T00:00:00Z'),
      user_id: 'user-123',
      completionCount: 0,
      isCompleted: false,
      directoryId: null
    },
  ];

  const defaultProps = {
    paginatedExercises: mockExercises,
    exercisesPerPage: 6,
    onPractice: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onMove: vi.fn(),
    onCreateClick: vi.fn(),
    canEdit: true,
  };

  it('renders exercise cards for each exercise', () => {
    render(<ExerciseGrid {...defaultProps} />);
    
    // Check if exercise titles are rendered
    expect(screen.getByText('Test Exercise 1')).toBeInTheDocument();
    expect(screen.getByText('Test Exercise 2')).toBeInTheDocument();
  });

  it('renders the create exercise card', () => {
    render(<ExerciseGrid {...defaultProps} />);
    expect(screen.getByText('Create Exercise')).toBeInTheDocument();
  });

  it('adds correct number of filler elements', () => {
    render(<ExerciseGrid {...defaultProps} />);
    
    // We have 2 exercises + 1 create card, and exercisesPerPage is 6
    // So we should have 3 filler elements (6 - 2 - 1)
    const fillers = document.querySelectorAll('.border-dashed.border-transparent');
    expect(fillers.length).toBe(3);
  });
});
