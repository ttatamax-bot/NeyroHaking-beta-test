export default async function meEntry(req: any, res: any) {
  const rewrittenPath = req.query?.__me_path;
  const requestPath = typeof rewrittenPath === "string"
    ? rewrittenPath
    : String(req.url ?? req.path ?? req.originalUrl ?? "");
  const normalizedPath = requestPath.startsWith("/api")
    ? requestPath
    : requestPath.startsWith("/me")
      ? `/api${requestPath}`
      : `/api/me${requestPath.startsWith("/") ? requestPath : `/${requestPath}`}`;
  req.url = normalizedPath;
  req.originalUrl = normalizedPath;

  const { default: app } = await import("../artifacts/api-server/src/app.js");
  return app(req, res);
}