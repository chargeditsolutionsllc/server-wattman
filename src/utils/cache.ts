import { PowerData } from '../types/server';
import redisClient from '../middleware/redis';
import { logger } from './logger';

const CACHE_PREFIX = 'server-power:';
const CACHE_TTL = 60; // 60 seconds

export async function getCachedPowerData(serverName: string): Promise<PowerData | null> {
  try {
    const cachedData = await redisClient.get(`${CACHE_PREFIX}${serverName}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    logger.error('Error reading from cache:', error);
    return null;
  }
}

export async function setCachedPowerData(data: PowerData): Promise<void> {
  try {
    await redisClient.setex(
      `${CACHE_PREFIX}${data.serverName}`,
      CACHE_TTL,
      JSON.stringify(data)
    );
  } catch (error) {
    logger.error('Error writing to cache:', error);
  }
}

export async function invalidateServerCache(serverName: string): Promise<void> {
  try {
    await redisClient.del(`${CACHE_PREFIX}${serverName}`);
  } catch (error) {
    logger.error('Error invalidating cache:', error);
  }
}

export async function getAllCachedPowerData(): Promise<PowerData[]> {
  try {
    const keys = await redisClient.keys(`${CACHE_PREFIX}*`);
    if (keys.length === 0) return [];

    const cachedData = await redisClient.mget(keys);
    return cachedData
      .filter((data): data is string => data !== null)
      .map(data => JSON.parse(data));
  } catch (error) {
    logger.error('Error fetching all cached data:', error);
    return [];
  }
}

export async function clearAllServerCache(): Promise<void> {
  try {
    const keys = await redisClient.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.error('Error clearing cache:', error);
  }
}
