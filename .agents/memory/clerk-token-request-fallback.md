---
name: Clerk token request fallback
description: Bounded client auth-token and API waits for same-origin account hydration.
---

Same-origin account API calls should not depend indefinitely on the Clerk token resource resolving; the browser session cookie can authenticate the request when available.

**Why:** A browser-side Clerk token promise can remain pending while the API itself is healthy, leaving account hydration on an infinite spinner with no server error.

**How to apply:** Bound token acquisition and the API request, fall back to credentials-included cookie authentication, and surface a retryable error when both paths fail.