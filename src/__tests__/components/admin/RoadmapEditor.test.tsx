
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../utils/test-utils';
import RoadmapEditor from '@/components/admin/RoadmapEditor';

describe('RoadmapEditor', () => {
  it('renders the deprecated message', () => {
    render(<RoadmapEditor />);
    expect(screen.getByText('Roadmap functionality has been deprecated.')).toBeInTheDocument();
  });
});
