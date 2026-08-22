export default async function leaderboardEntry(req: any, res: any) {
  const mode = String(req.query?.mode ?? "");
  const normalizedPath = `/api/leaderboards/${encodeURIComponent(mode)}`;
  req.url = normalizedPath;
  req.originalUrl = normalizedPath;

  const { default: app } = await import("../../artifacts/api-server/src/app.js");
  return app(req, res);
}