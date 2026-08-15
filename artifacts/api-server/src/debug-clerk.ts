import express from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";

const app = express();

app.use(
  clerkMiddleware(() => ({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  })),
);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    userId: getAuth(req).userId ?? null,
  });
});

app.use((error: unknown, _req: any, res: any, _next: any) => {
  res.status(500).json({
    ok: false,
    error: error instanceof Error ? error.message : "Unknown Clerk middleware error",
  });
});

export default app;