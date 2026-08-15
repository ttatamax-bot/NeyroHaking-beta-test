import { integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const legacyMigrationsTable = pgTable("legacy_migrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  migrationKey: text("migration_key").notNull(),
  sourceState: jsonb("source_state").notNull(),
  audit: jsonb("audit").notNull().default({}),
  status: text("status").notNull().default("imported"),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // A legacy snapshot is imported once per account, not once per browser/device.
  userIdx: uniqueIndex("legacy_migrations_user_idx").on(table.userId),
}));
export type LegacyMigration = typeof legacyMigrationsTable.$inferSelect;