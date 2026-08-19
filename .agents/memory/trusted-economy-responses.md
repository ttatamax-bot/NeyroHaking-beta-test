---
name: Trusted economy responses
description: Client hydration rule for purchases, grants, and other server-owned economy mutations.
---

Successful economy mutations should apply the returned authoritative profile/state to the client immediately. A follow-up profile refresh may be best-effort, but must not be required to show the purchase or grant as completed.

**Why:** A second hydration request can fail independently after the mutation has committed, leaving the UI showing the old balance or locked item and encouraging duplicate actions.

**How to apply:** For key spending, referrals, subscriptions, or unlocks, merge the mutation response directly into the store and keep protected server-owned fields out of ordinary autosave paths.