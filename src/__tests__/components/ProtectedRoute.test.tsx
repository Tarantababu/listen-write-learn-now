
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils/test-utils';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/use-admin';
import { toast } from '@/hooks/use-toast';
import { Navigate, Outlet } from 'react-router-dom';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/use-admin');
vi.mock('@/hooks/use-toast');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(() => <div>Redirected</div>),
    Outlet: vi.fn(() => <div>Outlet content</div>),
    useLocation: vi.fn(() => ({ pathname: '/test-path' })),
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading state when checking authentication', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: true } as any);
    vi.mocked(useAdmin).mockReturnValue({ isAdmin: false, loading: false } as any);
    
    render(<ProtectedRoute />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false } as any);
    vi.mocked(useAdmin).mockReturnValue({ isAdmin: false, loading: false } as any);
    
    render(<ProtectedRoute />);
    
    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/login',
        replace: true,
      }),
      expect.anything()
    );
    expect(toast).toHaveBeenCalled();
  });

  it('renders children when user is authenticated and children are provided', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '123' }, loading: false } as any);
    vi.mocked(useAdmin).mockReturnValue({ isAdmin: false, loading: false } as any);
    
    render(<ProtectedRoute><div>Protected content</div></ProtectedRoute>);
    
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('renders outlet when user is authenticated and no children are provided', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '123' }, loading: false } as any);
    vi.mocked(useAdmin).mockReturnValue({ isAdmin: false, loading: false } as any);
    
    render(<ProtectedRoute />);
    
    expect(Outlet).toHaveBeenCalled();
  });

  it('redirects to dashboard when requireAdmin is true but user is not admin', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '123' }, loading: false } as any);
    vi.mocked(useAdmin).mockReturnValue({ isAdmin: false, loading: false } as any);
    
    render(<ProtectedRoute requireAdmin={true} />);
    
    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/dashboard',
        replace: true,
      }),
      expect.anything()
    );
  });

  it('renders content when requireAdmin is true and user is admin', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '123' }, loading: false } as any);
    vi.mocked(useAdmin).mockReturnValue({ isAdmin: true, loading: false } as any);
    
    render(<ProtectedRoute requireAdmin={true}><div>Admin content</div></ProtectedRoute>);
    
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});
