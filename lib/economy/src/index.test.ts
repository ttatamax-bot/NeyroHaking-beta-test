import assert from "node:assert/strict";
import {
  DAY_POTENTIAL_TARGET,
  clampDayPotential,
  dayCloseReward,
  isDayClosed,
  normalizeDayPotential,
  plannerAccuracy,
  plannerBasePotential,
  plannerPotential,
  potentialForTechnique,
} from "./index.js";

assert.equal(plannerBasePotential(10), 3);
assert.equal(plannerBasePotential(30), 10);
assert.equal(plannerBasePotential(60), 20);
assert.equal(plannerBasePotential(120), 40);
assert.equal(plannerBasePotential(600), 90);

assert.equal(plannerAccuracy(600, 600), 1);
assert.ok(plannerAccuracy(1200, 600) < 0.7);
assert.equal(plannerPotential(0, 600), 0);
assert.equal(
  potentialForTechnique("T1", { actualSeconds: 600, estimatedSeconds: 600 }),
  3,
);
assert.equal(
  potentialForTechnique("T2", {}),
  10,
  "ordinary techniques always add ten percentage points",
);
assert.equal(
  potentialForTechnique("T1", { actualSeconds: 100, estimatedSeconds: 600 }),
  0,
  "very short planner sessions do not award potential",
);

assert.equal(dayCloseReward(1), 100);
assert.equal(dayCloseReward(2), 125);
assert.equal(dayCloseReward(15), 450);
assert.equal(dayCloseReward(30), 450);
assert.equal(normalizeDayPotential(137), 137);
assert.equal(clampDayPotential(137), DAY_POTENTIAL_TARGET);
assert.equal(clampDayPotential(42.26), 42.3);
assert.equal(isDayClosed(100), true);
assert.equal(isDayClosed(100.1), true);
assert.equal(isDayClosed(99.9), false);

console.log("Economy assertions passed.");