import { NextApiRequest, NextApiResponse } from 'next';
import { getRedisClient } from '@/lib/redis-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const redis = getRedisClient();
    
    // Get a list of all keys
    const keys = await redis.keys('*');
    
    // Get specific key data if provided in query
    const key = req.query.key as string;
    let value = null;
    
    if (key) {
      value = await redis.get(key);
      // Try to parse JSON if possible
      try {
        value = JSON.parse(value);
      } catch (e) {
        // If not JSON, keep as is
      }
    }
    
    res.status(200).json({
      keys,
      total: keys.length,
      value: key ? value : undefined,
      siteKeys: keys.filter(k => k.includes('site:')),
      userKeys: keys.filter(k => k.includes('user:')),
      domainKeys: keys.filter(k => k.includes('domain:')),
      categoryKeys: keys.filter(k => k.includes('category:'))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
