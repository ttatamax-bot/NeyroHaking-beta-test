---
name: Memory technique server state
description: Server-owned persistence and daily reward rules for the Memory technique.
---

Multi-mode techniques keep purchases, best levels, and their shared app-day level-5 reward marker in protected server state. Successful levels use the existing completion ledger and idempotency flow; only the first level 5+ completion within that technique group can add its daily potential bonus.

**Why:** The archived implementation was a localStorage prototype with a fake key balance, while purchases, records, and the once-per-day reward must survive sessions and remain tamper-resistant.

**How to apply:** Do not allow `/me/state` autosave to overwrite protected multi-mode economy state. New practice groups should use the same purchase/completion path as T7 and preserve a group-level reward-day guard.