import { integer, pgTable, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";
import { usersTable } from "./users.js";

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  nickname: text("nickname"),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  totalKeys: integer("total_keys").notNull().default(0),
  totalPotential: real("total_potential").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({ nicknameIdx: uniqueIndex("user_profiles_nickname_idx").on(table.nickname) }));

export const updateUserProfileSchema = z.object({
  nickname: z.string().trim().min(3).max(32).optional(),
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().max(2048).optional(),
});
export type UserProfile = typeof userProfilesTable.$inferSelect;