import { date, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";
import { usersTable } from "./users.js";

export const streakHistoryTable = pgTable("streak_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  status: text("status").notNull(),
  streakCount: integer("streak_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ userDateIdx: uniqueIndex("streak_history_user_date_idx").on(table.userId, table.date) }));
export const insertStreakHistorySchema = z.object({
  userId: z.number().int(),
  date: z.string(),
  status: z.enum(["completed", "skipped"]),
  streakCount: z.number().int().min(0),
});
export type StreakHistory = typeof streakHistoryTable.$inferSelect;