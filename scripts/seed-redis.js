/**
 * Redis Seed Script
 * 
 * This script seeds Redis with initial data required for the application to function.
 * It should be run after starting the Redis container but before running E2E tests.
 */

const Redis = require('ioredis');

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DEFAULT_SITE_DOMAIN = 'fishinggearreviews.com';
const DEFAULT_SITE_NAME = 'Fishing Gear Reviews';
const USE_MEMORY_FALLBACK = process.env.USE_MEMORY_FALLBACK === 'true';

// Initial site data
const initialSite = {
  id: 'site_fishing',
  name: DEFAULT_SITE_NAME,
  slug: 'fishing-gear-reviews',
  domain: DEFAULT_SITE_DOMAIN,
  description: 'Reviews and information about fishing gear and equipment',
  active: true,
  created_at: Date.now(),
  updated_at: Date