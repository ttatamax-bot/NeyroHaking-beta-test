---
name: Legacy migration integrity
description: Security boundary for importing local Neurohacking state
---

Legacy localStorage totals, potential history, and streak history are never authoritative. Validated key ledger entries may be imported as historical balance operations, while activities are stored as history only; legacy activities never create new potential, closed days, or streaks. Activities that lack the raw inputs needed for their history record remain in the audit as warnings.

**Why:** LocalStorage can be edited by the client, so claimed potential/streak totals and reconstructed rewards could inflate the new economy. Users still need their historical key ledger and non-economy progress preserved.

**How to apply:** Import key entries only after validating amount, type, source, and date; derive the current key balance from that ledger. Keep potential/streak fields out of migrated state and never create reward transactions from legacy activities.