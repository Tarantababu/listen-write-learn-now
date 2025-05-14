
/**
 * Base service class with common utilities
 */
export class BaseService {
  /**
   * Get current user information
   */
  protected getUser() {
    // In a real implementation, fetch from auth system
    // For now, mock a user
    return {
      id: 'user-1',
      email: 'user@example.com',
    };
  }
}
