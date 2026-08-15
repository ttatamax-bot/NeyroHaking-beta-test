import { real, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { usersTable } from "./users.js";

export const potentialTransactionsTable = pgTable("potential_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  reason: text("reason").notNull(),
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertPotentialTransactionSchema = z.object({ userId: z.number().int(), amount: z.number(), reason: z.string().min(1) });
export type PotentialTransaction = typeof potentialTransactionsTable.$inferSelect;