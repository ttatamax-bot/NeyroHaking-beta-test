---
name: Completion ledger hydration
description: Source of truth for restoring technique completion UI across devices.
---

The completion ledger is the authoritative source for technique-derived checklist flags, activity entries, and earn-history entries. Client state remains a presentation cache and should be persisted immediately after a successful completion, but hydration must rebuild missing presentation data from server completion rows.

**Why:** Rewards and streaks were committed server-side while the debounced client state save could be missed or the presentation fields could be absent on another device.

**How to apply:** When adding a technique completion or changing its metadata, update the server completion response/hydration mapping and keep the local optimistic entry keyed by the server completion id to avoid duplicates.