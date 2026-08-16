---
name: Empty migration recovery
description: Preserve cross-device progress when an early server sync created an empty legacy migration.
---

An account-level legacy migration record created from an empty/default browser snapshot must remain recoverable. A later meaningful local snapshot should be allowed to replace that empty import; a meaningful existing migration must remain authoritative.

**Why:** A temporary API failure caused one device to miss its first migration, while another device created an empty migration row and then saw a fresh onboarding state.

**How to apply:** Distinguish meaningful progress from default state on both client and server, retry hydration after transient API failures, and update an existing empty migration record instead of rejecting later progress.