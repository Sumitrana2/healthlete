import {
    pgTable, uuid, varchar,
    boolean, timestamp, integer, jsonb, index
  } from "drizzle-orm/pg-core";
  import { adminRoleEnum } from "./enums";
  import type { AdminPermissions } from "../../../common/constants/admin.constants";
  
  export const admins = pgTable("admins", {
    id:           uuid("id").primaryKey().defaultRandom(),
    slug:         varchar("slug", { length: 200 }).notNull().unique(),
  

    email:        varchar("email", { length: 255 }).notNull().unique(),
    firstName:    varchar("first_name", { length: 100 }).notNull(),
    lastName:     varchar("last_name", { length: 100 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  

    role:         adminRoleEnum("role").default("admin").notNull(),
    isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
    permissions:  jsonb("permissions").$type<AdminPermissions>().notNull(),
  

    isActive:             boolean("is_active").default(true).notNull(),
    lastLoginAt:          timestamp("last_login_at"),
    failedLoginAttempts:  integer("failed_login_attempts").default(0),
    lockedUntil:          timestamp("locked_until"),
  

    createdBy: uuid("created_by"), 
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }, (t) => ({
    emailIdx:        index("admins_email_idx").on(t.email),
    slugIdx:         index("admins_slug_idx").on(t.slug),
    isSuperAdminIdx: index("admins_super_admin_idx").on(t.isSuperAdmin),
  }));