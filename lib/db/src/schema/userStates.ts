import { integer, jsonb, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { usersTable } from "./users";

export const userStatesTable = pgTable("user_states", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  state: jsonb("state").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
export const insertUserStateSchema = z.object({ userId: z.number().int(), state: z.record(z.string(), z.any()) });
export type UserStateRow = typeof userStatesTable.$inferSelect;