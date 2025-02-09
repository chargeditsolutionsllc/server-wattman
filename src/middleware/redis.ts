import { Redis } from 'ioredis';
import { logger } from '@/utils/logger';

// Prevent multiple connections during development hot reloads
declare global {
  var redis: Redis | undefined;
}

const redisClient = global.redis || new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection attempt ${times} failed. Retrying in ${delay}ms`);
    return delay;
  },
});

if (process.env.NODE_ENV !== 'production') {
  global.redis = redisClient;
}

redisClient.on('error', (error) => {
  logger.error('Redis Client Error:', error);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

export default redisClient;
