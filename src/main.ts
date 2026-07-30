import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { RequestMethod } from "@nestjs/common";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { join } from "path";
import { AppModule } from "./app.module";
import { env } from "./config/env";
import logger from "./shared/logger/logger";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { SanitizeInterceptor } from "./common/interceptors/sanitize.interceptor";
import { setupSwagger } from "./config/swagger.setup";
import { checkDatabaseConnection, closeDatabaseConnection } from "./database/drizzle";
import { requestLogger } from "./common/middleware/requestLogger";

async function bootstrap() {
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    logger.fatal({}, "Cannot start server: database unavailable");
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

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
  app.set("trust proxy", 1);
  app.use(cookieParser());
  app.useBodyParser("json", { limit: "10mb" });
  app.use(requestLogger);
  app.useStaticAssets(join(process.cwd(), "src/uploads"), { prefix: "/uploads" });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new SanitizeInterceptor());
  app.setGlobalPrefix("api/v1", {
    exclude: [{ path: "health", method: RequestMethod.GET }],
  });

  setupSwagger(app);

  await app.listen(env.PORT);
  logger.info({ port: env.PORT, environment: env.NODE_ENV }, "HealthLete API running");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received, closing gracefully");
    await app.close();
    await closeDatabaseConnection();
    logger.info("Server closed");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "Unhandled rejection");
    process.exit(1);
  });
}

void bootstrap();
