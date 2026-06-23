import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import swaggerUi from "swagger-ui-express";
import { generateSwaggerDocs } from "./config/swagger";
import cookieParser from "cookie-parser";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { sanitizeInput } from "./middleware/sanitize";

import path from "path";
import "./routes/v1/swagger";
// import './routes/v2/swagger';

import apiRoutes from "./routes";

export function createApp(): Application {
  const app = express();

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
    })
  );
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(sanitizeInput);
  app.use("/uploads", express.static(path.join(process.cwd(), "src/uploads")));
  app.use(requestLogger);
  app.use(globalRateLimiter);

  app.get("/health", (_, res) => {
    res.json({ status: "ok", env: env.NODE_ENV, ts: new Date().toISOString() });
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(generateSwaggerDocs()));

  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
