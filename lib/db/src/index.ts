import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Re-export Drizzle query helpers so consumers never import from "drizzle-orm" directly.
// This ensures only one copy of drizzle-orm types exists across the monorepo.
export { and, asc, desc, eq, gt, gte, ilike, inArray, isNull, lt, lte, ne, not, or, sql } from "drizzle-orm";

export * from "./schema/index.js";
