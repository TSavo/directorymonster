/**
 * Authentication utilities for DirectoryMonster
 */

import { cookies } from 'next/headers';
import { kv } from '../redis-client';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  adminSites?: string[];
  tenantId?: string;
  lastLogin?: Date;
}

/**
 * Get the current user from the session
 */
export async function currentUser(): Promise<User | null> {
  try {
    const sessionCookie = cookies().get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }
    
    // Get user from Redis using the session token
    const userId = await kv.get<string>(`session:${sessionCookie}`);
    
    if (!userId) {
      return null;
    }
    
    const user = await kv.get<User>(`user:${userId}`);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get user from session for API routes
 */
export async function getUserFromSession(request?: Request): Promise<User | null> {
  try {
    // If request is provided, get the session cookie from the request
    if (request) {
      const cookieHeader = request.headers.get('cookie');
      if (!cookieHeader) return null;
      
      const cookies = parseCookies(cookieHeader);
      const sessionToken = cookies['session'];
      
      if (!sessionToken) return null;
      
      // Get user from Redis using the session token
      const userId = await kv.get<string>(`session:${sessionToken}`);
      
      if (!userId) return null;
      
      const user = await kv.get<User>(`user:${userId}`);
      return user;
    }
    
    // Otherwise, use the currentUser function
    return currentUser();
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

/**
 * Verify session token for API routes
 */
export async function verifySession(request: Request): Promise<User | null> {
  return getUserFromSession(request);
}

/**
 * Parse cookies from cookie header
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = value;
  });
  
  return cookies;
}

/**
 * Verify authentication for API routes
 */
export async function verifyAuth(request: Request): Promise<boolean> {
  const user = await getUserFromSession(request);
  return !!user;
}

export default {
  currentUser,
  getUserFromSession,
  verifySession,
  verifyAuth
};
