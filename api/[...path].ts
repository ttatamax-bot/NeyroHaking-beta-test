function hasClerkToken(req: any): boolean {
  const authorization = req.headers?.authorization;
  const cookie = req.headers?.cookie ?? "";
  return Boolean(
    authorization ||
      /(?:^|;\s*)__session=/.test(cookie) ||
      /(?:^|;\s*)__client_uat=/.test(cookie),
  );
}

export default async function apiPathEntry(req: any, res: any) {
  const requestPath = String(req.url ?? req.path ?? req.originalUrl ?? "");
  const isClerkProxyRoute = requestPath.includes("/__clerk");
  if (!isClerkProxyRoute && !hasClerkToken(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!requestPath.startsWith("/api")) {
    const normalizedPath = `/api${requestPath.startsWith("/") ? requestPath : `/${requestPath}`}`;
    req.url = normalizedPath;
    req.originalUrl = normalizedPath;
  }
  const { default: app } = await import("../artifacts/api-server/src/app.js");
  return app(req, res);
}