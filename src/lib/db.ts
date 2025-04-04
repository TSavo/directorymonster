/**
 * Database client for user management
 * This is a simple mock implementation for testing
 */

import { User } from '@/types';

// In-memory user store
const users: Record<string, User> = {};

export const db = {
  /**
   * Find a user by ID
   */
  findUserById: async (id: string): Promise<User | null> => {
    return users[id] || null;
  },

  /**
   * Find a user by email
   */
  findUserByEmail: async (email: string): Promise<User | null> => {
    const user = Object.values(users).find(u => u.email === email);
    return user || null;
  },

  /**
   * Create a new user
   */
  createUser: async (userData: Partial<User>): Promise<User> => {
    const id = userData.id || `user_${Date.now()}`;
    const newUser: User = {
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
  },

  /**
   * Update a user
   */
  updateUser: async (id: string, userData: Partial<User>): Promise<User | null> => {
    if (!users[id]) return null;
    
    users[id] = {
      ...users[id],
      ...userData,
      updatedAt: Date.now(),
    };
    
    return users[id];
  },

  /**
   * Delete a user
   */
  deleteUser: async (id: string): Promise<boolean> => {
    if (!users[id]) return false;
    
    delete users[id];
    return true;
  },

  /**
   * List all users
   */
  listUsers: async (): Promise<User[]> => {
    return Object.values(users);
  },

  /**
   * Reset a user's password
   */
  resetPassword: async (email: string): Promise<boolean> => {
    const user = await db.findUserByEmail(email);
    if (!user) return false;
    
    // In a real implementation, this would generate a reset token
    // and send an email to the user
    return true;
  },

  /**
   * Helper to seed test data
   */
  __seedTestUser: (user: User): void => {
    users[user.id] = user;
  },

  /**
   * Helper to clear test data
   */
  __clearTestUsers: (): void => {
    Object.keys(users).forEach(key => {
      delete users[key];
    });
  },
};

export default db;
