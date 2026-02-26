import redis from 'redis';

/**
 * Cache Service - Manages Redis caching for datasource responses
 * Functional approach with connection pooling and TTL support
 */

let redisClient = null;
let isRedisConnected = false;
const defaultTTL = parseInt(process.env.CACHE_TTL) || 3600; // 1 hour default

/**
 * Initialize Redis connection
 */
export async function initializeRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = redis.createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      console.error('⚠ Redis client error:', err);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✓ Connected to Redis');
      isRedisConnected = true;
    });

    await redisClient.connect();
    isRedisConnected = true;
  } catch (error) {
    console.warn('⚠ Redis connection not available, caching will be disabled:', error.message);
    isRedisConnected = false;
  }
}

/**
 * Get cached data by key
 */
export async function getFromCache(key) {
  if (!isRedisConnected || !redisClient) {
    return null;
  }

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      console.log(`✓ Cache hit: ${key}`);
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.warn(`⚠ Error retrieving cache for ${key}:`, error.message);
    return null;
  }
}

/**
 * Set cached data with TTL
 */
export async function setInCache(key, value, ttl = defaultTTL) {
  if (!isRedisConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    console.log(`✓ Cache set: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.warn(`⚠ Error setting cache for ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete cached data
 */
export async function deleteFromCache(key) {
  if (!isRedisConnected || !redisClient) {
    return false;
  }

  try {
    const result = await redisClient.del(key);
    if (result > 0) {
      console.log(`✓ Cache deleted: ${key}`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`⚠ Error deleting cache for ${key}:`, error.message);
    return false;
  }
}

/**
 * Clear all cached data by pattern
 */
export async function clearCacheByPattern(pattern) {
  if (!isRedisConnected || !redisClient) {
    return false;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`✓ Cache cleared: ${keys.length} keys matching ${pattern}`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`⚠ Error clearing cache by pattern ${pattern}:`, error.message);
    return false;
  }
}

/**
 * Check if Redis is connected
 */
export function isRedisConnectedStatus() {
  return isRedisConnected;
}

/**
 * Disconnect from Redis (call at app shutdown)
 */
export async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      isRedisConnected = false;
      console.log('✓ Disconnected from Redis');
    } catch (error) {
      console.error('Error disconnecting from Redis:', error.message);
    }
  }
}

