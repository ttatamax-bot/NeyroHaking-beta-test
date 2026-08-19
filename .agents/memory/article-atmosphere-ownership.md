---
name: Article atmosphere ownership
description: Product boundary between Academy article cards and the article preview screen.
---

The instrument-style background, large animated article icon, and sparse article-specific rings belong to the full-screen article preview after an Academy card is tapped. Rings should vary in position, size, opacity, rotation, and dash length without chaotic overlap or a central gauge; they must not be introduced as a separate preview card inside the Academy list.

**Why:** The user explicitly clarified that the uploaded screenshot showed the incorrect extra-card treatment, not a desired reference. Adding a visual card above the article content made the page look like a nested card instead of a themed article screen; duplicated visual tokens also caused A4/A5 preview colors to drift from their Academy cards.

**How to apply:** Keep Academy cards compact: article icon on the left, a small animated lock aligned to the far right, and numeric prices only where applicable. Keep the preview's article color, glow, and surface aligned with the same Academy visual tokens. Put article-specific atmosphere behind the full `/article/:id` preview screen so the entire page background changes by article, with colored status/action states instead of generic gray controls.