import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { BrandModule } from "../brand/brand.module";
import { BrandChannelsController } from "./controllers/brand-channels.controller";
import { AdminChannelsController } from "./controllers/admin-channels.controller";
import { ChannelsService } from "./services/channels.service";
import { AdminChannelsService } from "./services/admin-channels.service";
import { ChannelsRepository } from "./repositories/channels.repository";

@Module({
  imports: [BrandModule, AdminModule],
  controllers: [BrandChannelsController, AdminChannelsController],
  providers: [ChannelsService, AdminChannelsService, ChannelsRepository],
  exports: [ChannelsService, ChannelsRepository],
})
export class MediaChannelModule {}
