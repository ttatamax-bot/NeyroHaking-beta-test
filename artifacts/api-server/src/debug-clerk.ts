import { clerkMiddleware, getAuth } from "@clerk/express";

const clerk = clerkMiddleware(() => ({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
}));

type DebugResponse = {
  status(code: number): DebugResponse;
  json(payload: unknown): void;
};

export default async function debugClerk(req: any, res: DebugResponse) {
  try {
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        const next = (error?: unknown) => {
          if (error) reject(error);
          else resolve();
        };
        const result: any = clerk(req, res as any, next);
        if (result && typeof result.catch === "function") {
          result.catch(reject);
        }
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Clerk middleware timed out")), 5000),
      ),
    ]);

    res.status(200).json({
      ok: true,
      userId: getAuth(req).userId ?? null,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown Clerk middleware error",
    });
  }
}