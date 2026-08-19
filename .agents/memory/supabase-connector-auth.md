---
name: Supabase connector authentication
description: The attached Supabase connector may remain unusable from CodeExecution even after reconnecting.
---

The Supabase connection can report `added` while `proxyFetch` still returns `401 No API key found` and no authenticated client is available.

**Why:** A beta database mutation must never proceed when the connector cannot prove which database is being accessed.

**How to apply:** Treat this as an access problem, not a reason to request raw credentials; verify the target database before any mutation and stop if authenticated access is unavailable.