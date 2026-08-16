import app from "../artifacts/api-server/src/app.js";

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
  return app(req, res);
}