import { createApp } from './app';
import { env } from './config/env';
import { checkDatabaseConnection, closeDatabaseConnection } from './db';
import logger from './config/logger';

async function bootstrap() {
  // 1. Verify DB connection before accepting traffic
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    logger.fatal({ }, 'Cannot start server: database unavailable');
    process.exit(1);
  }

  // 2. Start Express
  const app = createApp();
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info({ port: env.PORT, environment: env.NODE_ENV }, 'HealthLete API running');
  });

  // 3. Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received, closing gracefully');
    server.close(async () => {
      await closeDatabaseConnection();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled rejection');
    process.exit(1);
  });
}

bootstrap();
