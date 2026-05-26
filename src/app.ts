import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import swaggerUi from 'swagger-ui-express';
import { generateSwaggerDocs } from './config/swagger';
import './modules/athletes/athletes.swagger'; // registers the routes

// ── Module Routers ─────────────────────────────────────────────────────────────
import athleteRoutes from './modules/athletes/athletes.routes';

export function createApp(): Application {
  const app = express();

  // ── Security ────────────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  }));
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

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(generateSwaggerDocs()));


  // ── API Routes ───────────────────────────────────────────────────────────────
  const api = env.API_PREFIX;
  app.use(`${api}/athletes`, athleteRoutes);
  
  // ── 404 + Error Handling ─────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
