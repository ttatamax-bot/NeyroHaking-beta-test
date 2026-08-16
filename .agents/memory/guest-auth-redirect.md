---
name: Guest auth redirect
description: Guest progress registration redirect must survive Vercel SPA routing and initial local-state hydration.
---

Use a base-path-aware full navigation for the guest-to-registration transition, with a short timer so the latest guest snapshot is persisted before reload. Check both the hydrated React state and the stored guest snapshot.

**Why:** An in-memory router transition alone was not reliable across the first render and production SPA rewrites, so both the first-technique and returning-guest flows appeared to do nothing.

**How to apply:** Keep the redirect disabled for loaded Clerk users and for sign-in/sign-up routes; derive the target from `import.meta.env.BASE_URL`.