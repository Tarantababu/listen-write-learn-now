
import { rest } from 'msw';

// Define mock API handlers
export const handlers = [
  // Mock auth endpoints
  rest.post('*/auth/v1/token', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      })
    );
  }),

  // Mock user profile
  rest.get('*/profiles', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'user-123',
        learning_languages: ['spanish', 'french'],
        selected_language: 'spanish',
      })
    );
  }),

  // Mock exercises endpoint
  rest.get('*/exercises', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'exercise-1',
          title: 'Sample Exercise 1',
          text: 'This is a sample exercise text',
          language: 'spanish',
          tags: ['beginner', 'grammar'],
          createdAt: '2023-01-01T12:00:00Z',
          user_id: 'user-123',
        },
        {
          id: 'exercise-2',
          title: 'Sample Exercise 2',
          text: 'Another sample exercise text',
          language: 'spanish',
          tags: ['intermediate', 'vocabulary'],
          createdAt: '2023-01-02T12:00:00Z',
          user_id: 'user-123',
        },
      ])
    );
  }),
];
