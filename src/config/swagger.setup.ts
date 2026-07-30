import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("HealthLete API")
    .setDescription("Athlete health media & decision intelligence platform")
    .setVersion("1.0.0")
    .addTag("Brand Onboarding", "Lookup data used during brand onboarding")
    .addTag("Admin Athletes", "Search and manage athletes via HypeAuditor")
    .addCookieAuth("brand_access_token")
    .addCookieAuth("admin_access_token")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Admin access token from POST /admin/auth/login",
      },
      "admin-access-token"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
  });
}
