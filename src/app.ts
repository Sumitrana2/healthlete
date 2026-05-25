import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// ── Module Routers ─────────────────────────────────────────────────────────────
import athleteRoutes from './routes/athletes/athletes.routes';
import scoreRoutes from './routes/scores/scores.routes';

export function createApp(): Application {
  const app = express();

  // ── Security ────────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );

  // ── Parsing ─────────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Logging ─────────────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', (_, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV, ts: new Date().toISOString() });
  });

  // ── API Routes ───────────────────────────────────────────────────────────────
  const api = env.API_PREFIX;
  app.use(`${api}/athletes`, athleteRoutes);
  app.use(`${api}/scores`, scoreRoutes);
  
  // ── 404 + Error Handling ─────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
