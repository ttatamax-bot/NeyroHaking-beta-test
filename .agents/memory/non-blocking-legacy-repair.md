---
name: Non-blocking legacy repair
description: Account hydration behavior when historical migration repair encounters bad legacy data.
---

Legacy ledger reconciliation is maintenance work and must not be a prerequisite for returning the current user profile and state from `/me`.

**Why:** A repair failure for one migrated account turned the entire account hydration request into an error, blocking both new-device sign-in and existing-device progress loading.

**How to apply:** Log repair failures and retry them later, but continue the `/me` response with the current server state and profile.