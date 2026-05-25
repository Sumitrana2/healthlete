import { createApp } from './app';
import { env } from './config/env';
import { checkDatabaseConnection, closeDatabaseConnection } from './db';

async function bootstrap() {
  // 1. Verify DB connection before accepting traffic
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    console.error('Cannot start server: database unavailable');
    process.exit(1);
  }

  // 2. Start Express
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 HealthLete API running on http://localhost:${env.PORT}${env.API_PREFIX}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });

  // 3. Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await closeDatabaseConnection();
      console.log('Server closed. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    process.exit(1);
  });
}

bootstrap();
