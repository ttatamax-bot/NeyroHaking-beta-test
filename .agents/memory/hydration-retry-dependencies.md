---
name: Hydration retry dependencies
description: React dependency requirements for retrying authenticated account hydration.
---

If account hydration schedules a retry by incrementing a state tick, that tick must be included in the hydration effect dependencies.

**Why:** The retry setter was called after a failed `/api/me`, but the effect depended only on the stable setter function. The counter changed without rerunning the effect, so the signed-in home screen stayed on the loading spinner indefinitely.

**How to apply:** Include the retry value or use an explicit retry callback that is a dependency; expose a visible retry state instead of silently retrying forever.