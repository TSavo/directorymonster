import { redis } from './redis-client';

export function getRedisClient() {
  return redis;
}