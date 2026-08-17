---
name: Vercel workspace source imports
description: Runtime module resolution for shared TypeScript packages used by Vercel API functions.
---

Vercel serverless functions in this workspace must not rely on a workspace package export that points to a TypeScript source file at runtime. A package such as `@workspace/economy` can typecheck and work in the local Node/tsx workflow while Vercel leaves the generated server module importing `src/index.ts`, causing `FUNCTION_INVOCATION_FAILED` before Clerk authentication.

**Why:** The health endpoint imported only the database module and stayed green, masking the fact that the account API crashed while loading the full Express route graph. The failure was reproducible with an invalid token, proving it happened before authentication.

**How to apply:** For shared code used by Vercel API entrypoints, import the source through a relative `.js`-suffixed path that the Vercel bundler can resolve into the function bundle. Keep the API handler's lazy app import when static importing the Express app causes a Vercel invocation failure; validate with an invalid bearer request expecting Clerk `401`, not `500`.