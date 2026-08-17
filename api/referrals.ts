export default async function referralsEntry(req: any, res: any) {
  const requestPath = String(req.url ?? req.path ?? req.originalUrl ?? "");
  const normalizedPath = requestPath.startsWith("/api")
    ? requestPath
    : `/api${requestPath.startsWith("/") ? requestPath : `/${requestPath}`}`;
  req.url = normalizedPath;
  req.originalUrl = normalizedPath;
  const { default: app } = await import("../artifacts/api-server/src/app.js");
  return app(req, res);
}