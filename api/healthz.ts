type HealthResponse = {
  status(code: number): {
    json(payload: unknown): void;
  };
};

declare const process: {
  env: Record<string, string | undefined>;
};

export default async function healthz(_req: unknown, res: HealthResponse) {
  let databaseReachable = false;
  let databaseSchema = false;
  let databaseError: string | null = null;

  if (process.env.DATABASE_URL) {
    try {
      const { pool } = await import("../lib/db/src/index.js");
      await pool.query("select 1");
      databaseReachable = true;
      await pool.query("select 1 from users limit 0");
      await pool.query("select 1 from user_profiles limit 0");
      await pool.query("select 1 from user_states limit 0");
      await pool.query("select 1 from legacy_migrations limit 0");
      databaseSchema = true;
    } catch (error) {
      // Keep health output safe for a public endpoint; the booleans identify
      // whether the configured database can actually serve account sync.
      const code = typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      databaseError = code ||
        (message.includes("password") || message.includes("authentication")
          ? "authentication_failed"
          : message.includes("timeout") || message.includes("timed out")
            ? "connection_timeout"
            : message.includes("enotfound") || message.includes("getaddrinfo")
              ? "host_not_found"
              : "connection_failed");
    }
  }

  const healthy = databaseReachable && databaseSchema &&
    Boolean(process.env.CLERK_SECRET_KEY) &&
    Boolean(process.env.CLERK_PUBLISHABLE_KEY);

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    runtime: "vercel",
    configuration: {
      database: Boolean(process.env.DATABASE_URL),
      clerkSecret: Boolean(process.env.CLERK_SECRET_KEY),
      clerkPublishable: Boolean(process.env.CLERK_PUBLISHABLE_KEY),
    },
    database: {
      reachable: databaseReachable,
      schema: databaseSchema,
      error: databaseError,
    },
  });
}