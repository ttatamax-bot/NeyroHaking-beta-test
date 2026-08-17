import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";

export const referralCouponsTable = pgTable("referral_coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  amount: integer("amount").notNull().default(1000),
  createdByUserId: integer("created_by_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  claimedByUserId: integer("claimed_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
});

export type ReferralCoupon = typeof referralCouponsTable.$inferSelect;