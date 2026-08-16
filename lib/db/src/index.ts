import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

function normalizePostgresConnectionString(value: string): string {
  const schemeEnd = value.indexOf("://");
  if (schemeEnd < 0) return value;

  const credentialsStart = schemeEnd + 3;
  const atIndex = value.lastIndexOf("@");
  if (atIndex <= credentialsStart) return value;

  const credentials = value.slice(credentialsStart, atIndex);
  const separator = credentials.indexOf(":");
  if (separator < 0) return value;

  const username = credentials.slice(0, separator);
  const rawPassword = credentials.slice(separator + 1);
  let decodedPassword = rawPassword;
  try {
    decodedPassword = decodeURIComponent(rawPassword);
  } catch {
    // Keep malformed percent sequences intact before encoding them below.
  }

  return `${value.slice(0, credentialsStart)}${username}:${encodeURIComponent(decodedPassword)}${value.slice(atIndex)}`;
}

export const pool = new Pool({
  connectionString: normalizePostgresConnectionString(process.env.DATABASE_URL),
});
export const db = drizzle(pool, { schema });

// Re-export Drizzle query helpers so consumers never import from "drizzle-orm" directly.
// This ensures only one copy of drizzle-orm types exists across the monorepo.
export { and, asc, desc, eq, gt, gte, ilike, inArray, isNull, lt, lte, ne, not, or, sql } from "drizzle-orm";

export * from "./schema/index.js";
