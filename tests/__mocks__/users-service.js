/**
 * Users Service Mock for Tests
 */

const usersServiceMock = {
  /**
   * Get all users
   */
  getUsers: jest.fn().mockResolvedValue([
    { id: 'user1', name: 'User 1' },
    { id: 'user2', name: 'User 2' }
  ]),

  /**
   * Get user by ID
   */
  getUserById: jest.fn().mockImplementation((id) => {
    if (id === 'nonexistent') {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`
    });
  }),

  /**
   * Create a new user
   */
  createUser: jest.fn().mockImplementation((userData) => {
    if (userData.email === 'invalid-email') {
      return Promise.reject(new Error('Validation failed: invalid email format'));
    }
    return Promise.resolve({
      id: 'new-user-id',
      ...userData,
      createdAt: new Date().toISOString()
    });
  }),

  /**
   * Update a user
   */
  updateUser: jest.fn().mockImplementation((userData) => {
    if (userData.id === 'nonexistent') {
      return Promise.resolve(null);
    }
    if (userData.email === 'invalid-email') {
      return Promise.reject(new Error('Validation failed: invalid email format'));
    }
    return Promise.resolve({
      ...userData,
      updatedAt: new Date().toISOString()
    });
  }),

  /**
   * Delete a user
   */
  deleteUser: jest.fn().mockImplementation((id) => {
    if (id === 'nonexistent') {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }),

  /**
   * Helper to reset the mock state
   */
  __resetMock: () => {
    Object.values(usersServiceMock).forEach(fn => {
      if (typeof fn === 'function' && fn.mockClear) {
        fn.mockClear();
      }
    });
  }
};

module.exports = usersServiceMock;
