---
name: Technique navigation
description: Interaction rule for route-backed technique cards in the Techniques tab.
---

Every technique card with a route must navigate when tapped, preferably through a base-aware native `href` link plus the app router rather than only a custom gesture handler. Completion state may change the card appearance or earning behavior, but must not silently block opening the technique; only cards without a route should be disabled. Keep route cards as ordinary buttons/links without transformed 3D ancestors.

**Why:** The user reported that technique buttons appeared completely unresponsive. Early state guards and a custom pointer/click chain both made navigation fragile, especially in preview and after a technique was completed. A fullscreen onboarding touch layer and a transformed perspective card wrapper can intercept or break mobile hit-testing even when the visible card looks correct.

**How to apply:** Use an accessible native route link or button for entries with a route, prefix native links with the artifact base path when needed, and route taps through the app router. Do not place the action inside a `perspective`, `rotateX`, or animated transformed parent. Keep `disabled`/`aria-disabled` only for genuinely unavailable entries such as the coming-soon card with no route, and make onboarding guidance non-blocking on the technique grid.