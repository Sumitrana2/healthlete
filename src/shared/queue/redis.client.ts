import Redis from 'ioredis';
import { env } from '../../config/env';
import logger from '../logger/logger';

const redis = new Redis({
  host:     env.REDIS_HOST,
  port:     env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error',   (err) => logger.error({ err }, 'Redis error'));

export default redis;