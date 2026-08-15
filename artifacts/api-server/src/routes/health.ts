import { createCompatibleRouter } from "./compatRouter.js";

const router = createCompatibleRouter();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

export default router;
