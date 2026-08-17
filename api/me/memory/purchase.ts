function hasClerkToken(req: any): boolean {
  const authorization = req.headers?.authorization;
  const cookie = req.headers?.cookie ?? "";
  return Boolean(
    authorization ||
      /(?:^|;\s*)__session=/.test(cookie) ||
      /(?:^|;\s*)__client_uat=/.test(cookie),
  );
}

export default async function memoryPurchaseEntry(req: any, res: any) {
  if (!hasClerkToken(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.url = `/api/me/memory/purchase${req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`;
  req.originalUrl = req.url;

  const { default: app } = await import("../../../artifacts/api-server/src/app.js");
  return app(req, res);
}