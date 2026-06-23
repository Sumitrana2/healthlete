import { pgTable, varchar, jsonb, text, timestamp } from 'drizzle-orm/pg-core';

export const appSettings = pgTable('app_settings', {
  key:         varchar('key', { length: 100 }).primaryKey(),
  value:       jsonb('value').notNull(),
  description: text('description'),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
});