export default async function apiPathEntry(req: any, res: any) {
  const requestPath = String(req.url ?? req.path ?? req.originalUrl ?? "");
  const isClerkProxyRoute = requestPath.includes("/__clerk");
  if (!requestPath.startsWith("/api")) {
    const normalizedPath = `/api${requestPath.startsWith("/") ? requestPath : `/${requestPath}`}`;
    req.url = normalizedPath;
    req.originalUrl = normalizedPath;
  }
  const { default: app } = await import("../artifacts/api-server/src/app.js");
  return app(req, res);
}