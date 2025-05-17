
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn, signUp, signInWithGoogle, signOut, getCurrentUser } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Auth Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('calls supabase signInWithPassword and returns data on success', async () => {
      const mockData = { user: { id: '123', email: 'test@example.com' } };
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: mockData, error: null } as any);

      const result = await signIn('test@example.com', 'password');
      
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result).toEqual(mockData);
    });

    it('throws error and shows toast on failure', async () => {
      const mockError = { message: 'Invalid credentials' };
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: null, error: mockError } as any);

      await expect(signIn('test@example.com', 'wrongpassword')).rejects.toEqual(mockError);
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  // Similar tests for signUp, signInWithGoogle, etc.
});
