import redis from "../../shared/queue/redis.client";
import logger from "../../shared/logger/logger";
import { CACHE_TTL } from "../constants/app.constants";

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    logger.error({ err }, "Cache get error");
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.DEFAULT
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    logger.error({ err }, "Cache set error");
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.error({ err }, "Cache delete error");
  }
}

export async function deleteCacheByPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch (err) {
    logger.error({ err }, "Cache delete pattern error");
  }
}
