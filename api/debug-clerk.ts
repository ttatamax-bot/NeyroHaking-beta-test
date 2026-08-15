type DebugResponse = {
  status(code: number): {
    json(payload: unknown): void;
  };
};

export default async function debugClerk(req: unknown, res: DebugResponse) {
  try {
    await import("../artifacts/api-server/src/debug-clerk.js");
    res.status(200).json({ loaded: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Clerk diagnostic error";
    res.status(500).json({
      loaded: false,
      error: message.slice(0, 240),
    });
  }
}