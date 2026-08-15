import { Router } from "express";
import healthRouter from "./health.js";
import meRouter from "./me.js";
import techniquesRouter from "./techniques.js";

const router = Router();
router.use(healthRouter);
router.use(meRouter);
router.use(techniquesRouter);

export default router;
