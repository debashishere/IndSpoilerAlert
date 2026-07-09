import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 1000,
    reconnectStrategy: false
  }
});

redisClient.on('error', (err) => {
  // Suppress ECONNREFUSED logs to keep tests clean
  if (!err.message?.includes('ECONNREFUSED')) {
    console.warn('Redis Client Error:', err.message || err);
  }
});

let isConnected = false;
let hasFailed = false;

export async function getRedisClient() {
  if (hasFailed) {
    return null;
  }
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
    } catch (err: any) {
      hasFailed = true;
      console.warn('Could not connect to Redis, failing gracefully.');
      return null;
    }
  }
  return redisClient;
}

export async function closeRedisConnection() {
  if (isConnected) {
    try {
      await redisClient.quit();
      isConnected = false;
    } catch (err) {
      // Ignore close errors
    }
  }
}
