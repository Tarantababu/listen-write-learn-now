
# Testing Documentation

This project uses Vitest for unit and integration testing, along with React Testing Library for component testing.

## Running Tests

Since we cannot modify the package.json, you'll need to run tests using the node_modules/.bin directly:

```bash
# Run all tests
npx vitest

# Run tests with UI
npx vitest --ui

# Run tests in watch mode
npx vitest watch

# Run tests with coverage
npx vitest --coverage
```

## Test Structure

- `src/__tests__/` - Contains all test files and utilities
  - `setup.ts` - Test setup file imported by Vitest
  - `utils/` - Test utilities like render helpers
  - `mocks/` - Mock API handlers and server setup
  - `components/` - Component tests
  - `lib/` - Library function tests

## Writing Tests

### Component Tests

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils/test-utils';
import YourComponent from '@/components/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Your Expected Text')).toBeInTheDocument();
  });
});
```

### API Tests

```tsx
import { describe, it, expect, vi } from 'vitest';
import { yourApiFunction } from '@/lib/yourApiModule';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })),
  },
}));

describe('yourApiFunction', () => {
  it('fetches data correctly', async () => {
    const result = await yourApiFunction();
    expect(supabase.from).toHaveBeenCalled();
    expect(result).toEqual(expectedResult);
  });
});
```
