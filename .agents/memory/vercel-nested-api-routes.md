---
name: Vercel nested API routes
description: Production routing behavior for nested Vercel API functions backed by the Express app.
---

Vercel can resolve an explicit nested function while a generic catch-all is unavailable or while a nested function receives a path with its directory prefix stripped. Route-sensitive entrypoints should normalize `req.url` to the Express `/api/...` path before delegating to the app, and important production endpoints should have explicit Vercel entrypoints.

**Why:** The production completion request returned Vercel `NOT_FOUND` before Express even though the route existed in the shared server router. A dedicated entrypoint made the same request reach Express, where an invalid test token correctly produced Clerk `401`.

**How to apply:** When adding a nested API route to this project, verify the deployed URL directly with an invalid bearer token: `401` means the function and Express route are reachable; Vercel `NOT_FOUND` means the function mapping is missing.