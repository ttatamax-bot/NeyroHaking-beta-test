---
name: Vercel nested API routes
description: Production routing behavior for nested Vercel API functions backed by the Express app.
---

In this project, Vercel did not resolve nested catch-all functions for `/api/me/*`, while many explicit functions exceeded the Hobby deployment limit. Route-sensitive account paths use one `/api/me` function plus a `vercel.json` rewrite that passes the nested suffix in a query parameter; the handler normalizes it to Express `/api/...`.

**Why:** Production purchase requests returned Vercel `NOT_FOUND` before Express even though the routes existed in the shared server router. Adding one function per nested route exceeded the Hobby limit; the single rewritten entrypoint reaches Express and an unauthenticated request correctly produces Clerk `401`.

**How to apply:** Keep account endpoints behind the shared `/api/me` rewrite. For body-sensitive mutations, include critical discriminators in the rewrite query as well as JSON. Verify deployed URLs directly with no bearer token: `401` means the function and Express route are reachable; Vercel `NOT_FOUND` means the mapping is missing.