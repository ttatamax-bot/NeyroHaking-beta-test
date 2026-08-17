---
name: Memory technique server state
description: Server-owned persistence and daily reward rules for the Memory technique.
---

The Memory technique keeps purchased modes, best levels, and the shared app-day reward marker in protected server state. Successful levels use the existing completion ledger and idempotency flow; only the first level 5+ completion across all modes can add the daily potential bonus.

**Why:** The archived implementation was a localStorage prototype with a fake key balance, while purchases, records, and the once-per-day reward must survive sessions and remain tamper-resistant.

**How to apply:** Do not allow `/me/state` autosave to overwrite the protected memory economy. New Memory modes should use the same T7 completion path and preserve the shared reward-day guard.