import { integer, jsonb, pgTable, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";
import { usersTable } from "./users";

export const completedTechniquesTable = pgTable("completed_techniques", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  techniqueId: text("technique_id").notNull(),
  appDay: text("app_day").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  keysAwarded: integer("keys_awarded").notNull().default(0),
  potentialAwarded: real("potential_awarded").notNull().default(0),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  userIdempotencyIdx: uniqueIndex("completed_techniques_user_idempotency_idx").on(table.userId, table.idempotencyKey),
}));

export const insertCompletedTechniqueSchema = z.object({
  userId: z.number().int(),
  techniqueId: z.string().min(1),
  appDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  idempotencyKey: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type CompletedTechnique = typeof completedTechniquesTable.$inferSelect;