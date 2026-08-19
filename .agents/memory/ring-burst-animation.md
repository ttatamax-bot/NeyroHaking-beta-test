---
name: Explicit ring startup burst
description: Startup ring acceleration should be a finite animation phase followed by the original looping rotation.
---

Keep each ring's normal infinite loop untouched and add a separate smooth additive rotation layer. Its velocity eases up and down over the 1.5-second entry window, then the overlay holds while the original loop continues.

**Why:** The intended effect is a temporary acceleration over the existing standard speed, not a replacement loop, a fixed extra-turn animation, or a new permanent rotation speed.

**How to apply:** Keep the overlay centered on the exact ring origin (or local to each ring), preserve every ring’s original base duration and repeat settings, and do not toggle React state when the burst ends because that can restart Framer loops.