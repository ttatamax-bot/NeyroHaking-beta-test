---
name: Vercel external environment setup
description: Production environment requirements when the app is built from GitHub by an external Vercel project.
---

GitHub-connected Vercel projects do not inherit Replit Secrets. A successful static build can therefore serve the frontend while the API health endpoint reports missing Clerk and database configuration.

**Why:** The production Vercel project had an empty environment-variable set even though the corresponding Replit Secrets existed; `/api/healthz` returned 503 with database and Clerk configuration false.

**How to apply:** Before declaring an external Vercel deployment fully operational, configure production `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and the frontend's `VITE_CLERK_PUBLISHABLE_KEY` in Vercel without copying schema migration commands into the frontend build.