import { Module } from "@nestjs/common";
import { HypeAuditorService } from "./hypeauditor.service";

@Module({
  providers: [HypeAuditorService],
  exports: [HypeAuditorService],
})
export class HypeAuditorModule {}
