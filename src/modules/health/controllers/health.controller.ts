import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { env } from "../../../config/env";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Health check" })
  check() {
    return {
      status: "ok",
      env: env.NODE_ENV,
      ts: new Date().toISOString(),
    };
  }
}
