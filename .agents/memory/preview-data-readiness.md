---
name: Preview data readiness
description: Clerk loading guards must not block unauthenticated local preview rendering.
---

For an unauthenticated Vite DEV preview, expose the local store as auth-ready and bypass page-level data loading guards; keep signed-in hydration and all production guards unchanged.

**Why:** Clerk can remain in a not-yet-loaded state in the preview browser even though the app is intentionally using local guest data, producing an endless data-loading screen.

**How to apply:** When adding a page-level loading guard, gate the auth/data wait with `!import.meta.env.DEV` unless the page is waiting for an independent API request that the preview actually needs.