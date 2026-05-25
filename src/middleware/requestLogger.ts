import morgan from 'morgan';
import { env } from '../config/env';

// Compact for dev, combined for production
export const requestLogger = morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev');
