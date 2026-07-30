import { Global, Module } from "@nestjs/common";
import { db, pool } from "./drizzle";

export const DRIZZLE = Symbol("DRIZZLE");
export const PG_POOL = Symbol("PG_POOL");

@Global()
@Module({
  providers: [
    { provide: DRIZZLE, useValue: db },
    { provide: PG_POOL, useValue: pool },
  ],
  exports: [DRIZZLE, PG_POOL],
})
export class DatabaseModule {}
