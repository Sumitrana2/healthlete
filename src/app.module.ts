import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import redis from "./shared/queue/redis.client";
import { RATE_LIMIT } from "./common/constants/app.constants";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./shared/queue/redis.module";
import { MailModule } from "./shared/mail/mail.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BrandModule } from "./modules/brand/brand.module";
import { AdminModule } from "./modules/admin/admin.module";
import { CompanyModule } from "./modules/company/company.module";
import { HealthModule } from "./modules/health/health.module";
import { AthleteModule } from "./modules/athlete/athlete.module";
import { AiModule } from "./modules/ai/ai.module";
import { CampaignModule } from "./modules/campaign/campaign.module";
import { PartnershipModule } from "./modules/partnership/partnership.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { ScoringModule } from "./modules/scoring/scoring.module";
import { HealthConditionModule } from "./modules/health-condition/health-condition.module";
import { IndustryModule } from "./modules/industry/industry.module";
import { MediaChannelModule } from "./modules/media-channel/media-channel.module";
import { LanguageModule } from "./modules/language/language.module";
import { CountryModule } from "./modules/country/country.module";
import { UploadModule } from "./modules/upload/upload.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { HypeAuditorModule } from "./integrations/hypeauditor/hypeauditor.module";
import { OpenAiModule } from "./integrations/openai/openai.module";

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    MailModule,
    AuthModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "default",
          ttl: RATE_LIMIT.GLOBAL_WINDOW_MS,
          limit: RATE_LIMIT.GLOBAL_MAX,
        },
        {
          name: "auth",
          ttl: RATE_LIMIT.AUTH_WINDOW_MS,
          limit: RATE_LIMIT.AUTH_MAX,
        },
        {
          name: "otp",
          ttl: RATE_LIMIT.OTP_WINDOW_MS,
          limit: RATE_LIMIT.OTP_MAX,
        },
      ],
      storage:
        process.env.NODE_ENV === "production"
          ? new ThrottlerStorageRedisService(redis)
          : undefined,
    }),
    BrandModule,
    AdminModule,
    CompanyModule,
    HealthModule,
    AthleteModule,
    AiModule,
    CampaignModule,
    PartnershipModule,
    NotificationModule,
    DashboardModule,
    AnalyticsModule,
    ScoringModule,
    HealthConditionModule,
    IndustryModule,
    MediaChannelModule,
    LanguageModule,
    CountryModule,
    UploadModule,
    SettingsModule,
    HypeAuditorModule,
    OpenAiModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
