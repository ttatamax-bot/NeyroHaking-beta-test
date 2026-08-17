---
name: Referral schema provisioning
description: New referral endpoints depend on the idempotent database schema bootstrap before they can be tested or served.
---

The API workflow builds and starts the server but does not automatically apply newly added database tables. Run the idempotent schema bootstrap before testing a feature whose route queries a new table.

**Why:** A missing table appears as a generic API 500 even when TypeScript, the build, and the server startup are all healthy.

**How to apply:** After adding or changing persistent tables, apply the development schema before preview checks; production must receive the same non-destructive schema change before enabling the route there.