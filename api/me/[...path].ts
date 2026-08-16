import app from "../../artifacts/api-server/src/app.js";

function hasClerkToken(req: any): boolean {
  const authorization = req.headers?.authorization;
  const cookie = req.headers?.cookie ?? "";
  return Boolean(
    authorization ||
      /(?:^|;\s*)__session=/.test(cookie) ||
      /(?:^|;\s*)__client_uat=/.test(cookie),
  );
}

export default async function mePathEntry(req: any, res: any) {
  if (!hasClerkToken(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const requestPath = String(req.url ?? req.path ?? req.originalUrl ?? "");
  if (!requestPath.startsWith("/api")) {
    const normalizedPath = requestPath.startsWith("/me")
      ? `/api${requestPath}`
      : `/api/me${requestPath.startsWith("/") ? requestPath : `/${requestPath}`}`;
    req.url = normalizedPath;
    req.originalUrl = normalizedPath;
  }
  return app(req, res);
}