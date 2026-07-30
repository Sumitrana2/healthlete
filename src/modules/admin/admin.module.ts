import { Module } from "@nestjs/common";
import { AdminAuthController } from "./controllers/admin-auth.controller";
import { AdminAuthGuard } from "./guards/admin-auth.guard";
import { AdminAuthService } from "./services/admin-auth.service";
import { AdminAuthRepository } from "./repositories/admin-auth.repository";
import { AiModule } from "../ai/ai.module";

@Module({
  controllers: [AdminAuthController],
  providers: [AdminAuthGuard, AdminAuthService, AdminAuthRepository],
  exports: [AdminAuthGuard, AdminAuthRepository],
  imports: [
    AiModule,
  ],
})
export class AdminModule {}
