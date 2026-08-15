import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { usersTable } from "./users.js";

export const keyTransactionsTable = pgTable("key_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertKeyTransactionSchema = z.object({ userId: z.number().int(), amount: z.number().int(), reason: z.string().min(1) });
export type KeyTransaction = typeof keyTransactionsTable.$inferSelect;