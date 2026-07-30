import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { SanitizeInterceptor } from "../src/common/interceptors/sanitize.interceptor";

/**
 * Full-app integration tests — requires PostgreSQL and Redis running.
 * Run with: npm run test:e2e:integration
 */
describe("HealthLete API integration (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new SanitizeInterceptor());
    app.setGlobalPrefix("api/v1", { exclude: ["health"] });
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  describe("GET /api/v1/common/taxonomy", () => {
    it("returns 400 without required query params", () => {
      return request(app.getHttpServer())
        .get("/api/v1/common/taxonomy")
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.code).toBe("VALIDATION_ERROR");
        });
    });
  });

  describe("POST /api/v1/brand/auth/login", () => {
    it("returns 400 for invalid body", () => {
      return request(app.getHttpServer())
        .post("/api/v1/brand/auth/login")
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });
  });

  describe("GET /api/v1/brand/profile/me", () => {
    it("returns 401 without auth cookie", () => {
      return request(app.getHttpServer())
        .get("/api/v1/brand/profile/me")
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.code).toBe("NO_TOKEN");
        });
    });
  });
});
