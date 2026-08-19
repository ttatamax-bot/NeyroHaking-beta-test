---
name: Collision-free tracking trajectories
description: Tracking practice needs precomputed multi-step positions with collision separation and explicit stage UI.
---

For the tracking practice, do not use one shared transform or looping motion. Generate dense per-ball paths, resolve pair distances at every waypoint, and drive the rendered coordinates directly during the movement stage. Keep the movement and target-selection stages visually distinct.

**Why:** Shared transforms looked like a single teleport, while independent unconstrained paths caused overlaps and made the stage boundary unclear.

**How to apply:** Any future tracking-motion change must preserve per-waypoint separation, a finite 5–10 second movement window, and a prominent instruction change before selection.