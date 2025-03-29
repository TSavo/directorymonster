import { NextApiRequest, NextApiResponse } from 'next';
import { getRedisClient } from '@/lib/redis-client';
import { getSiteBySlug } from '@/lib/site-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { slug } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Slug parameter is required' });
    }
    
    // Get direct Redis data for the site
    const redis = getRedisClient();
    const siteKeyPattern = `site:${slug}*`;
    const siteKeys = await redis.keys(siteKeyPattern);
    
    // Direct Redis data
    const redisData = {};
    for (const key of siteKeys) {
      const value = await redis.get(key);
      try {
        redisData[key] = JSON.parse(value);
      } catch (e) {
        redisData[key] = value;
      }
    }
    
    // Try to get site using the normal getSiteBySlug utility
    let site = null;
    let error = null;
    
    try {
      site = await getSiteBySlug(slug);
    } catch (e) {
      error = {
        message: e.message,
        stack: e.stack
      };
    }
    
    res.status(200).json({
      slug,
      siteKeys,
      redisData,
      site,
      error,
      lookupSuccess: site !== null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
