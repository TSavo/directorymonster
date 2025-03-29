import { NextApiRequest, NextApiResponse } from 'next';
import { sign } from 'jsonwebtoken';
import { getRedisClient } from '@/lib/redis-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // IMPORTANT: Only enable this endpoint in development/testing environments
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  try {
    const { username = 'admin' } = req.query;
    const redis = getRedisClient();
    
    // Get the user from Redis or create it if it doesn't exist
    const userKey = `user:${username}`;
    let user = await redis.get(userKey);
    
    if (!user) {
      // Create a test user if one doesn't exist
      user = JSON.stringify({
        id: username,
        username,
        isAdmin: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await redis.set(userKey, user);
    }
    
    // Parse user data
    const userData = typeof user === 'string' ? JSON.parse(user) : user;
    
    // Create a JWT token for the user
    const token = sign({ 
      sub: userData.id, 
      username: userData.username,
      isAdmin: userData.isAdmin
    }, process.env.AUTH_SECRET || 'development-auth-secret', {
      expiresIn: '1d'
    });
    
    // Return token and cookie info
    res.status(200).json({
      token,
      user: userData,
      cookieValue: `auth=${token}; Path=/; HttpOnly; Max-Age=86400;`,
      message: 'Use this token in your tests. This endpoint is for testing only.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
