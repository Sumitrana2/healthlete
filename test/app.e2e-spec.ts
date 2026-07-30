import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { HealthController } from "../src/modules/health/controllers/health.controller";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { SanitizeInterceptor } from "../src/common/interceptors/sanitize.interceptor";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { describe } from "node:test";
import { RATE_LIMIT } from '../src/constants/app.constants';

describe("HealthLete API (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [
            { name: "default", ttl: RATE_LIMIT.GLOBAL_WINDOW_MS, limit: RATE_LIMIT.GLOBAL_MAX },
            { name: "auth", ttl: RATE_LIMIT.AUTH_WINDOW_MS, limit: RATE_LIMIT.AUTH_MAX },
            { name: "otp", ttl: RATE_LIMIT.OTP_WINDOW_MS, limit: RATE_LIMIT.OTP_MAX },
          ],
        }),
      ],
      controllers: [HealthController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new SanitizeInterceptor());
    app.setGlobalPrefix("api/v1", { exclude: ["health"] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /health", () => {
    it("returns ok status", () => {
      return request(app.getHttpServer())
        .get("/health")
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe("ok");
          expect(res.body.env).toBe("test");
          expect(res.body.ts).toBeDefined();
        });
    });
  });
});
function beforeAll(arg0: () => Promise<void>) {
  throw new Error("Function not implemented.");
}

function afterAll(arg0: () => Promise<void>) {
  throw new Error("Function not implemented.");
}

function expect(status: any) {
  throw new Error("Function not implemented.");
}

