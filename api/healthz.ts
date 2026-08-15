type HealthResponse = {
  status(code: number): {
    json(payload: unknown): void;
  };
};

declare const process: {
  env: Record<string, string | undefined>;
};

export default function healthz(_req: unknown, res: HealthResponse) {
  res.status(200).json({
    status: "ok",
    runtime: "vercel",
    configuration: {
      database: Boolean(process.env.DATABASE_URL),
      clerkSecret: Boolean(process.env.CLERK_SECRET_KEY),
      clerkPublishable: Boolean(process.env.CLERK_PUBLISHABLE_KEY),
    },
  });
}