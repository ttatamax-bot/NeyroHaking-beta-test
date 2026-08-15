type DebugResponse = {
  status(code: number): {
    json(payload: unknown): void;
  };
};

export default async function debugClerk(req: unknown, res: DebugResponse) {
  try {
    const module = await import("../artifacts/api-server/src/debug-clerk.js");
    return module.default(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Clerk diagnostic error";
    res.status(500).json({
      loaded: false,
      error: message.slice(0, 240),
    });
  }
}