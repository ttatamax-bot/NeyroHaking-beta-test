function hasClerkToken(req: any): boolean {
  const authorization = req.headers?.authorization;
  const cookie = req.headers?.cookie ?? "";
  return Boolean(
    authorization ||
      /(?:^|;\s*)__session=/.test(cookie) ||
      /(?:^|;\s*)__client_uat=/.test(cookie),
  );
}

export default async function meEntry(req: any, res: any) {
  if (!hasClerkToken(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const requestPath = String(req.url ?? req.path ?? req.originalUrl ?? "");
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