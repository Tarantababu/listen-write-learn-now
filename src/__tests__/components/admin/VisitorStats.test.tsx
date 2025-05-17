
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../utils/test-utils';
import { VisitorStats } from '@/components/admin/VisitorStats';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        count: vi.fn().mockResolvedValue({ count: 100, error: null }),
        eq: vi.fn(() => ({
          gte: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
  },
}));

describe('VisitorStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<VisitorStats />);
    expect(screen.getByText('Loading visitor statistics...')).toBeInTheDocument();
  });

  it('fetches visitor statistics on mount', async () => {
    render(<VisitorStats />);
    
    // Check if supabase client was called
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled();
    });
  });
});
