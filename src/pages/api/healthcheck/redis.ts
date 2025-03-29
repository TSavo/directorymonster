import { NextApiRequest, NextApiResponse } from 'next';
import { getRedisClient } from '@/lib/redis-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const redis = getRedisClient();
    
    // Simple ping to check if Redis is responsive
    const pingResult = await redis.ping();
    
    // Check if we can set and get a value
    const testKey = 'healthcheck:test';
    const testValue = `test-${Date.now()}`;
    
    await redis.set(testKey, testValue);
    const retrievedValue = await redis.get(testKey);
    const isValueCorrect = retrievedValue === testValue;
    
    // Check if we can find site keys (if any exist)
    const siteKeys = await redis.keys('site:*');
    
    if (pingResult === 'PONG' && isValueCorrect) {
      res.status(200).json({
        status: 'ok',
        redis: 'connected',
        ping: pingResult,
        keyTest: isValueCorrect,
        siteCount: siteKeys.length,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'error',
        redis: 'failed',
        ping: pingResult,
        keyTest: isValueCorrect,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
