import healthRouter from "./health.js";
import meRouter from "./me.js";
import techniquesRouter from "./techniques.js";
import { createCompatibleRouter } from "./compatRouter.js";

const router = createCompatibleRouter();
router.use(healthRouter);
router.use(meRouter);
router.use(techniquesRouter);

export default router;
