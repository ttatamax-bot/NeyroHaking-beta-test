---
name: Vercel API runtime configuration
description: Production checks for the serverless API behind the Vercel frontend.
---

The local API and the Vercel serverless API do not share runtime environment automatically. A local health check can pass while Vercel returns FUNCTION_INVOCATION_FAILED if the serverless deployment lacks the Clerk or database configuration required during module initialization.

**Why:** The API server starts and answers health checks in Replit, while the same Vercel catch-all function can fail before routing when production runtime configuration is incomplete.

**How to apply:** Verify production API health and required runtime variables independently after every API deployment; do not treat a successful local workflow restart as proof that the Vercel function can initialize.

Vercel's GitHub status can report a successful deployment while the configured production alias still serves an older or failing function. The public `FUNCTION_INVOCATION_FAILED` response does not identify the failing module or route.

**Why:** The deployment status and the live custom URL were observed to disagree, while Vercel's deployment log endpoint required Vercel authentication unavailable in the workspace.

**How to apply:** Check the exact deployment target and the production alias separately; if the alias still fails after a successful build, obtain Vercel deployment logs or inspect the deployment URL before making further code changes.

Vercel API entrypoints that statically import the full Express app can fail before a request guard runs. Loading the app dynamically after the unauthenticated response makes public `401` checks reliable and avoids cold-start failures from unrelated server modules.

**Why:** The API function returned `FUNCTION_INVOCATION_FAILED` even for requests that should have been rejected before Clerk/DB work; a lazy import made the same production routes return JSON `401`.

**How to apply:** Keep lightweight authentication guards at the top of Vercel handlers and dynamically import the Express app only for requests that carry a session or auth header.

For browser-to-Vercel account hydration, send Clerk's current session token as a Bearer fallback in addition to `credentials: include`; a newly established session cookie may not be visible to the serverless request immediately.

**Why:** Authenticated sync requests could remain in a retry loop for every account even though sign-in succeeded and unauthenticated API checks were healthy.

**How to apply:** Register Clerk's `getToken` with the web API client after the provider mounts; keep cookie credentials enabled so unauthenticated guest requests and same-origin sessions continue to work.

Vercel cannot use an internal Replit PostgreSQL hostname; production must use an externally reachable Supabase pooler URL, and the schema must be initialized idempotently during the Vercel build.

**Why:** The Vercel function had a configured but unresolvable Replit database host, and later direct Supabase IPv6/Drizzle introspection paths failed before the API could create account records.

**How to apply:** Use Supavisor/Transaction pooler (`.pooler.supabase.com:6543`) with the full `postgres.<project-ref>` username, and run a non-destructive schema bootstrap before the frontend build.

Long-running technique completions need one forced Clerk-token refresh/retry, and every retry must reuse the same idempotency key.

**Why:** A goal save can work immediately while a meditation completion several minutes later encounters a stale auth token or a lost response; generating a new key on retry could duplicate rewards.

**How to apply:** Keep auth refresh/retry in the shared API client, and let each timed technique retain its completion key until the server confirms success.