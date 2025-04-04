/**
 * User Service
 * 
 * Provides methods for managing users in the system.
 */

import { kv } from '@/lib/redis-client';
import { hashPassword, comparePassword } from '@/lib/crypto';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: string;
  isAdmin: boolean;
  adminSites?: string[];
  tenantId?: string;
  locked?: boolean;
  lastLogin?: Date;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    return await kv.get<User>(`user:${id}`);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    // Get user ID by email
    const userId = await kv.get<string>(`user:email:${email}`);
    
    if (!userId) {
      return null;
    }
    
    // Get user by ID
    return getUserById(userId);
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User | null> {
  try {
    // Check if email already exists
    const existingUser = await getUserByEmail(userData.email);
    
    if (existingUser) {
      throw new Error('Email already in use');
    }
    
    // Generate user ID
    const id = `user_${Date.now()}`;
    
    // Hash password if provided
    let hashedPassword = undefined;
    if (userData.password) {
      hashedPassword = await hashPassword(userData.password);
    }
    
    // Create user object
    const now = Date.now();
    const user: User = {
      id,
      ...userData,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    };
    
    // Remove password from user object if not provided
    if (!userData.password) {
      delete user.password;
    }
    
    // Save user
    await kv.set(`user:${id}`, user);
    
    // Create email index
    await kv.set(`user:email:${userData.email}`, id);
    
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

/**
 * Update a user
 */
export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  try {
    // Get existing user
    const existingUser = await getUserById(id);
    
    if (!existingUser) {
      return null;
    }
    
    // Hash password if provided
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }
    
    // Update user object
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      id, // Ensure ID doesn't change
      updatedAt: Date.now(),
    };
    
    // Save updated user
    await kv.set(`user:${id}`, updatedUser);
    
    // Update email index if email changed
    if (userData.email && userData.email !== existingUser.email) {
      await kv.del(`user:email:${existingUser.email}`);
      await kv.set(`user:email:${userData.email}`, id);
    }
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    // Get existing user
    const existingUser = await getUserById(id);
    
    if (!existingUser) {
      return false;
    }
    
    // Delete user
    await kv.del(`user:${id}`);
    
    // Delete email index
    await kv.del(`user:email:${existingUser.email}`);
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

/**
 * List all users
 */
export async function listUsers(): Promise<User[]> {
  try {
    // Get all user keys
    const userKeys = await kv.keys('user:*');
    
    // Filter out email index keys
    const userIdKeys = userKeys.filter(key => !key.includes('user:email:'));
    
    // Get all users
    const userPromises = userIdKeys.map(key => kv.get<User>(key));
    const users = await Promise.all(userPromises);
    
    // Filter out null values and remove passwords
    return users
      .filter((user): user is User => user !== null)
      .map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
  } catch (error) {
    console.error('Error listing users:', error);
    return [];
  }
}

/**
 * Authenticate a user
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    // Get user by email
    const user = await getUserByEmail(email);
    
    if (!user || !user.password) {
      return null;
    }
    
    // Check if account is locked
    if (user.locked) {
      return null;
    }
    
    // Compare passwords
    const passwordMatch = await comparePassword(password, user.password);
    
    if (!passwordMatch) {
      return null;
    }
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

/**
 * Reset a user's password
 */
export async function resetPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    // Get existing user
    const existingUser = await getUserById(userId);
    
    if (!existingUser) {
      return false;
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user with new password
    const updatedUser: User = {
      ...existingUser,
      password: hashedPassword,
      updatedAt: Date.now(),
    };
    
    // Save updated user
    await kv.set(`user:${userId}`, updatedUser);
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}

export default {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  listUsers,
  authenticateUser,
  resetPassword,
};
