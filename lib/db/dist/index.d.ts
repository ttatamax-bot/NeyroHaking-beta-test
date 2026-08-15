import * as schema from "./schema/index.js";
export declare const pool: import("pg").Pool;
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: import("pg").Pool;
};
export { and, asc, desc, eq, gt, gte, ilike, inArray, isNull, lt, lte, ne, not, or, sql } from "drizzle-orm";
export * from "./schema/index.js";
//# sourceMappingURL=index.d.ts.map