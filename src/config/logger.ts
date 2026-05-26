import pino from 'pino';
import { env } from './env';
import fs from 'fs';

// Make sure logs/ folder exists
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

const streams = [
  // Terminal — pretty in dev, JSON in production
  {
    stream: env.NODE_ENV !== 'production'
      ? pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        })
      : process.stdout,
  },
  // File — always raw JSON (easy to parse/search later)
  {
    stream: pino.destination({
      dest: './logs/app.log',
      sync: false,
    }),
  },
];

const logger = pino(
  { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
  pino.multistream(streams)
);

export default logger;