/**
 * Database Client Mock for Tests
 */

// In-memory user store
const users = {};

const dbMock = {
  // Prisma-style models
  user: {
    findUnique: jest.fn(async ({ where }) => {
      if (where.id) {
        return users[where.id] || null;
      }
      if (where.email) {
        return Object.values(users).find(u => u.email === where.email) || null;
      }
      return null;
    }),
    findMany: jest.fn(async () => {
      return Object.values(users);
    }),
    create: jest.fn(async ({ data }) => {
      const id = data.id || `user_${Date.now()}`;
      const newUser = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      users[id] = newUser;
      return newUser;
    }),
    update: jest.fn(async ({ where, data }) => {
      const user = users[where.id];
      if (!user) return null;

      const updatedUser = { ...user, ...data, updatedAt: new Date() };
      users[where.id] = updatedUser;
      return updatedUser;
    }),
    delete: jest.fn(async ({ where }) => {
      const user = users[where.id];
      if (!user) return null;

      delete users[where.id];
      return user;
    })
  },
  /**
   * Find a user by ID
   */
  findUserById: jest.fn(async (id) => {
    return users[id] || null;
  }),

  /**
   * Find a user by email
   */
  findUserByEmail: jest.fn(async (email) => {
    const user = Object.values(users).find(u => u.email === email);
    return user || null;
  }),

  /**
   * Create a new user
   */
  createUser: jest.fn(async (userData) => {
    const id = userData.id || `user_${Date.now()}`;
    const newUser = {
      id,
      email: userData.email || '',
      name: userData.name || '',
      role: userData.role || 'user',
      createdAt: userData.createdAt || Date.now(),
      updatedAt: userData.updatedAt || Date.now(),
      acl: userData.acl || { entries: [] },
    };

    users[id] = newUser;
    return newUser;
  }),

  /**
   * Update a user
   */
  updateUser: jest.fn(async (id, userData) => {
    if (!users[id]) return null;

    users[id] = {
      ...users[id],
      ...userData,
      updatedAt: Date.now(),
    };

    return users[id];
  }),

  /**
   * Delete a user
   */
  deleteUser: jest.fn(async (id) => {
    if (!users[id]) return false;

    delete users[id];
    return true;
  }),

  /**
   * List all users
   */
  listUsers: jest.fn(async () => {
    return Object.values(users);
  }),

  /**
   * Reset a user's password
   */
  resetPassword: jest.fn(async (email) => {
    const user = await dbMock.findUserByEmail(email);
    if (!user) return false;

    // In a real implementation, this would generate a reset token
    // and send an email to the user
    return true;
  }),

  /**
   * Helper to seed test data
   */
  __seedTestUser: (user) => {
    users[user.id] = user;
  },

  /**
   * Helper to clear test data
   */
  __clearTestUsers: () => {
    Object.keys(users).forEach(key => {
      delete users[key];
    });
  },
};

module.exports = dbMock;
