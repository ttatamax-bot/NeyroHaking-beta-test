---
name: Legacy migration integrity
description: Security boundary for importing local Neurohacking state
---

Legacy localStorage totals and transaction histories are never authoritative. The server stores only non-authoritative UI state, and creates balances, technique history, resource transactions, and streaks from metadata that it can validate and recalculate. Activities that lack the raw inputs needed for a server calculation remain in the audit as warnings and do not change totals.

**Why:** LocalStorage can be edited by the client, so importing claimed rewards or totals would allow replay and balance inflation.

**How to apply:** Any new legacy field must be classified as audit-only or independently verifiable before it can affect a profile, ledger, completion, or streak.