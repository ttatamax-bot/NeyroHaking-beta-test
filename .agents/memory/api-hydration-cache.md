---
name: API hydration cache
description: Cache behavior that can block authenticated progress hydration.
---

Authenticated progress reads must use `cache: no-store`, and API responses should discourage revalidation, because a browser `304 Not Modified` response has no JSON body for the client parser.

**Why:** `/api/me` returned 304 during hydration; the client attempted `response.json()`, treated the empty response as a failed hydration, and retried indefinitely, leaving the progress screen stuck.

**How to apply:** Keep account-state GETs uncached on the client and apply no-store headers in the Express API path; validate with a signed-in hydration request rather than only an unauthenticated health check.