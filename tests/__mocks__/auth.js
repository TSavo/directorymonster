/**
 * Auth Module Mock for Tests
 */

const authMock = {
  /**
   * Get user from session
   */
  getUserFromSession: jest.fn(async () => {
    return {
      id: 'admin-user',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      acl: {
        userId: 'admin-user',
        entries: [
          {
            resource: 'users',
            action: '*',
            effect: 'allow'
          }
        ]
      }
    };
  }),
  /**
   * Verify a session
   */
  verifySession: jest.fn(async () => ({
    authenticated: true,
    user: {
      id: 'admin-user',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      acl: {
        userId: 'admin-user',
        entries: [
          {
            resource: 'users',
            action: '*',
            effect: 'allow'
          }
        ]
      }
    }
  })),

  /**
   * Check if a user has permission to perform an action on a resource
   */
  hasPermission: jest.fn((user, resource, action) => {
    if (!user || !user.acl) return false;

    const { entries } = user.acl;

    return entries.some(entry => {
      // Check for wildcard resource
      if (entry.resource === '*' && (entry.action === '*' || entry.action === action)) {
        return entry.effect === 'allow';
      }

      // Check for specific resource
      if (entry.resource === resource && (entry.action === '*' || entry.action === action)) {
        return entry.effect === 'allow';
      }

      return false;
    });
  }),

  /**
   * Generate a JWT token
   */
  generateToken: jest.fn((payload) => 'mock-jwt-token'),

  /**
   * Verify a JWT token
   */
  verifyToken: jest.fn((token) => ({
    userId: 'admin-user',
    exp: Math.floor(Date.now() / 1000) + 3600
  })),

  /**
   * Helper to reset the mock state
   */
  __resetMock: () => {
    Object.values(authMock).forEach(fn => {
      if (typeof fn === 'function' && fn.mockClear) {
        fn.mockClear();
      }
    });
  }
};

module.exports = authMock;
