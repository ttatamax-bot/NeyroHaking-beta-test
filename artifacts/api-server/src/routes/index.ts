import { Router } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import techniquesRouter from "./techniques";

const router = Router();
router.use(healthRouter);
router.use(meRouter);
router.use(techniquesRouter);

export default router;
