import { Global, Module } from "@nestjs/common";
import redis from "./redis.client";

export const REDIS = Symbol("REDIS");

@Global()
@Module({
  providers: [{ provide: REDIS, useValue: redis }],
  exports: [REDIS],
})
export class RedisModule {}
