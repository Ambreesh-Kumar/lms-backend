import redis from "../config/redis.js";

const DEFAULT_TTL = 60 * 5; // 5 minutes in seconds

export const getCache = async (key) => {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data);
};

export const setCache = async (key, value, ttl = DEFAULT_TTL) => {
  await redis.set(key, JSON.stringify(value), "EX", ttl);
};

export const deleteCache = async (key) => {
  await redis.del(key);
};

export const deleteCacheByPattern = async (pattern) => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};