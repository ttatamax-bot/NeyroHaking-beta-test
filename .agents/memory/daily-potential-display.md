---
name: Daily potential storage and display
description: The economy keeps the raw daily potential above 100 after a day closes while UI presentation clamps it to 100.
---

The raw daily potential is authoritative for detecting the first crossing of the 100% close threshold and for preserving later activity; only display helpers clamp it to 100.

**Why:** Capping the stored value at 100 made internal accounting lose post-close activity and conflated business state with presentation.

**How to apply:** Use the normalized raw value in server transactions and guest calculations, and apply the display clamp only when mapping profile/state data to visible percentages.